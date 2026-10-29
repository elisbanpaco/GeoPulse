"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Download, Share2, Ellipsis, FlaskConical } from "lucide-react";
interface Props {
  hasSelection: boolean;
  place: string;
  busy: boolean;
  onShare: () => void;
  onExport: () => void;
  onAdvanced: () => void;
}
export default function Header({
  hasSelection,
  place,
  busy,
  onShare,
  onExport,
  onAdvanced,
}: Props) {
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node))
        menu.current.open = false;
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const action = (callback: () => void) => {
    if (menu.current) menu.current.open = false;
    trigger.current?.focus();
    callback();
  };
  return (
    <header className="gx-header">
      <div className="gx-header-inner">
        <Link
          className="gx-brand"
          href="/"
          aria-label="GeoPulse, volver al inicio"
        >
          <span className="gx-brand-mark">
            gp
            <span />
          </span>
          <span>
            GeoPulse
            <span className="gx-brand-subtitle">
              Datos para entender tu región
            </span>
          </span>
        </Link>
        {hasSelection ? (
          <div className="gx-header-right">
            <span className="gx-header-place">{place}</span>
            <details
              ref={menu}
              className="gx-menu"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  if (menu.current) menu.current.open = false;
                  trigger.current?.focus();
                }
              }}
            >
              <summary ref={trigger} className="gx-button gx-button-quiet">
                <Ellipsis size={20} />
                Más
              </summary>
              <div className="gx-menu-items">
                <button onClick={() => action(onShare)}>
                  <Share2 size={17} />
                  Copiar enlace
                </button>
                <button disabled={busy} onClick={() => action(onExport)}>
                  <Download size={17} />
                  {busy ? "Descargando…" : "Descargar datos (CSV)"}
                </button>
                <hr />
                <button onClick={() => action(onAdvanced)}>
                  <FlaskConical size={17} />
                  Análisis avanzado
                </button>
              </div>
            </details>
          </div>
        ) : (
          <span className="gx-header-place">Seguridad ciudadana · Perú</span>
        )}
      </div>
    </header>
  );
}
