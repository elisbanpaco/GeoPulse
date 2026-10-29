"""Contract checks using synthetic source observations, no external datasets needed."""
import csv
from io import StringIO
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import httpx
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main as api


class DashboardTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.data_dir = patch.object(api, "DATA_DIR", Path(__file__).resolve().parents[1] / "sample_data")
        self.data_dir.start()
        api.load_data()
        self.assertTrue(api.db.is_loaded, api.db.error)
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=api.app), base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()
        self.data_dir.stop()

    async def get(self, path, **params):
        response = await self.client.get(api.PREFIX + path, params=params)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    async def test_catalog_matches_dictionary_and_source_measure(self):
        self.assertIn("deserción", api.CATALOG[70]["name"])
        self.assertIn("homicidios", api.CATALOG[30]["name"])
        self.assertEqual(api.CATALOG[30]["unit"], "homicidios")
        catalog = await self.get("/indicators")
        self.assertEqual([i["code"] for i in catalog], [10, 30])
        self.assertEqual(catalog[0]["years"], [2024, 2023])
        self.assertEqual(catalog[1]["value_column"], "VALORES")
        self.assertEqual(catalog[1]["display_name"], "Homicidios")
        self.assertEqual(catalog[1]["category"], "Delitos")
        self.assertIn("Tasa", catalog[1]["name"])

    async def test_national_is_original_observation_not_sum_of_regions(self):
        summary = await self.get("/summary", indicator=30, year=2024)
        regional = await self.get("/map-data", indicator=30, year=2024)
        self.assertEqual(summary["value"], 130)
        self.assertNotEqual(summary["value"], sum(r["value"] for r in regional))
        self.assertEqual(summary["yoy_variation_percent"], 8.33)
        self.assertIsNone(summary["missing_reason"])

    async def test_percentages_are_not_summed_or_replaced_by_zero(self):
        summary = await self.get("/summary", indicator=10, year=2024)
        self.assertIsNone(summary["value"])
        self.assertEqual(summary["missing_reason"], "Sin dato nacional")
        regional = await self.get("/map-data", indicator=10, year=2024)
        self.assertEqual(regional[0]["value"], 25)
        self.assertIsNone(regional[1]["value"])
        self.assertEqual(regional[0]["unit"], "%")

    async def test_region_year_and_indicator_filters_do_not_leak(self):
        summary = await self.get("/summary", indicator=30, region="01", year=2023)
        self.assertEqual(summary["value"], 12)
        self.assertEqual(summary["yoy_variation_percent"], 20)
        other = await self.get("/summary", indicator=10, region="01", year=2023)
        self.assertEqual(other["value"], 20)
        self.assertIsNone(other["yoy_variation_percent"])

    async def test_zero_denominator_and_nonconsecutive_years(self):
        zero = await self.get("/summary", indicator=30, region="02", year=2023)
        self.assertEqual(zero["value"], 0)
        self.assertIsNone(zero["yoy_variation_percent"])
        api.db.df = api.db.df[~((api.db.df.COD_DPTO == "01") & (api.db.df.ANIO == 2023))]
        result = await self.get("/summary", indicator=30, region="01", year=2024)
        self.assertIsNone(result["yoy_variation_percent"])
        anomalies = await self.get("/anomalies", indicator=30, year=2024)
        self.assertNotIn("01", [r["code"] for r in anomalies])

    async def test_lima_territories_remain_separate(self):
        regions = await self.get("/regions")
        self.assertIn({"code": "1501", "name": "Lima Metropolitana"}, regions)
        self.assertIn({"code": "1599", "name": "Lima Provincias"}, regions)
        self.assertNotIn("15", [r["code"] for r in regions])
        self.assertEqual((await self.get("/summary", indicator=30, region="1501", year=2024))["value"], 40)
        self.assertEqual((await self.get("/summary", indicator=30, region="1599", year=2024))["value"], 25)

    async def test_comparison_uses_selected_regions_and_complete_history(self):
        result = await self.get("/trends", indicator=30, region="01", compare_region="02", year=2024)
        self.assertEqual([s["COD_DPTO"] for s in result], ["01", "02"])
        self.assertEqual(result[0]["data"], [{"year": 2022, "value": 10}, {"year": 2023, "value": 12}, {"year": 2024, "value": 15}])

    async def test_validation_and_unavailable_data(self):
        for params in [{"indicator": 999}, {"indicator": 70}, {"year": 1990}, {"region": "15"}, {"region": "99"}, {"limit": -1}]:
            response = await self.client.get(api.PREFIX + "/top-regions" if "limit" in params else api.PREFIX + "/summary", params=params)
            self.assertEqual(response.status_code, 422, response.text)
        api.db.is_loaded = False
        self.assertEqual((await self.client.get(api.PREFIX + "/summary")).status_code, 503)
        self.assertEqual((await self.client.get("/health")).status_code, 503)

    async def test_distribution_is_explicitly_retired(self):
        self.assertEqual((await self.client.get(api.PREFIX + "/distribution")).status_code, 410)

    async def test_export_keeps_filters_units_sources_missing_and_zero(self):
        response = await self.client.get(api.PREFIX + "/export", params={"indicator": 30, "year": 2023, "region": "01", "compare_region": "02"})
        records = list(csv.DictReader(StringIO(response.text.lstrip("\ufeff"))))
        self.assertEqual([r["territorio"] for r in records], ["01", "02"])
        self.assertEqual([float(r["valor"]) for r in records], [12, 0])
        self.assertEqual(records[0]["unidad"], "homicidios")
        self.assertEqual(records[0]["fuente"], "DEMO_SINTETICO")
        self.assertEqual(records[0]["filtro_comparacion"], "02")
        self.assertIn("attachment", response.headers["content-disposition"])
        missing = await self.client.get(api.PREFIX + "/export", params={"indicator": 10, "year": 2024, "region": "02"})
        self.assertEqual(list(csv.DictReader(StringIO(missing.text.lstrip("\ufeff"))))[0]["valor"], "")

    async def test_duplicate_source_observations_fail_instead_of_sum(self):
        with tempfile.TemporaryDirectory() as folder:
            data = pd.read_csv(api.DATA_DIR / "DATASET_Ind_demo.csv")
            pd.concat([data, data.iloc[[0]]]).to_csv(Path(folder) / "DATASET_Ind_demo.csv", index=False)
            with patch.object(api, "DATA_DIR", Path(folder)), self.assertLogs(api.logger, level="ERROR"):
                api.load_data()
            self.assertFalse(api.db.is_loaded)

    async def test_predictions_unavailable_is_not_success(self):
        self.assertEqual((await self.client.get(api.PREFIX + "/predictions")).status_code, 503)


if __name__ == "__main__":
    unittest.main()
