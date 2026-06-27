"use client";
// ============================================
// GeoPulse — AlertPanel
// Derives intelligence alerts from the top
// regions data. No additional API calls needed.
// ============================================

import React from "react";
import { IntelligenceCard } from "@/components/cards/IntelligenceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatFullNumber } from "@/lib/utils";
import type { TopRegion, IntelligenceCardProps } from "@/lib/types";

// --- Props ---

interface AlertPanelProps {
  selectedYear?: number | null;
  regions: TopRegion[];
}

// --- Alert Generation ---

function generateAlerts(regions: TopRegion[]): IntelligenceCardProps[] {
  const alerts: IntelligenceCardProps[] = [];

  if (regions.length === 0) return alerts;

  // 1. Zona de mayor incidencia — the #1 region
  const top = regions[0];
  alerts.push({
    title: "Zona de mayor incidencia",
    description: `${top.NOM_DPTO} lidera con ${formatFullNumber(top.total_delitos)} incidentes registrados, requiriendo atención prioritaria de las autoridades competentes.`,
    severity: "critical",
    value: formatFullNumber(top.total_delitos),
    region: top.NOM_DPTO,
  });

  // 2. Anomalous concentration — if #1 is >50% more than #2
  if (regions.length >= 2) {
    const second = regions[1];
    const gap =
      ((top.total_delitos - second.total_delitos) / second.total_delitos) * 100;

    if (gap > 50) {
      alerts.push({
        title: "Concentración anómala de incidentes",
        description: `${top.NOM_DPTO} supera a ${second.NOM_DPTO} en un ${Math.round(gap)}%, indicando una concentración desproporcionada de actividad delictiva en la zona.`,
        severity: "high",
        value: `+${Math.round(gap)}%`,
        region: top.NOM_DPTO,
      });
    }
  }

  // 3. Total monitored regions
  const regionCount = regions.length;
  alerts.push({
    title: `${regionCount} regiones monitoreadas`,
    description: `El sistema de inteligencia está procesando datos de ${regionCount} regiones a nivel nacional en tiempo real.`,
    severity: "info",
    value: String(regionCount),
  });

  // 4. Data source information
  alerts.push({
    title: "Fuente: Plan de Acción de Seguridad Ciudadana",
    description:
      "Datos recopilados del Plan de Acción de Seguridad Ciudadana consolidado por el Ministerio del Interior del Perú.",
    severity: "info",
  });

  return alerts;
}

// --- Component ---

export default function AlertPanel({ selectedYear, regions }: AlertPanelProps) {
  const alerts = generateAlerts(regions);

  if (regions.length === 0) {
    return (
      <EmptyState
        title="Sin alertas disponibles"
        description="No se han detectado alertas para los filtros seleccionados."
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {alerts.map((alert, index) => (
        <div
          key={`alert-${index}`}
          className="gp-fade-in"
          style={{
            animationDelay: `${index * 80}ms`,
            animationFillMode: "both",
          }}
        >
          <IntelligenceCard
            title={alert.title}
            description={alert.description}
            severity={alert.severity}
            value={alert.value}
            region={alert.region}
            actionLabel={alert.actionLabel}
            onAction={alert.onAction}
          />
        </div>
      ))}

      {/* Year context label */}
      {selectedYear && (
        <div
          className="gp-fade-in"
          style={{
            animationDelay: `${alerts.length * 80}ms`,
            animationFillMode: "both",
            textAlign: "center",
            paddingTop: "4px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#94a3b8",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Periodo analizado: {selectedYear}
          </span>
        </div>
      )}
    </div>
  );
}
