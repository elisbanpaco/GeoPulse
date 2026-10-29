"use client";
import { useId, useRef, useState } from "react";
import { Check, ChevronDown, Search, X, MapPin } from "lucide-react";
import { normalizeSearch } from "@/lib/presentation";

export interface Choice {
  value: string;
  label: string;
  group?: string;
}
interface Props {
  label: string;
  title: string;
  options: Choice[];
  value?: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
  prominent?: boolean;
  compact?: boolean;
}
export default function SearchPicker({
  label,
  title,
  options,
  value,
  onSelect,
  placeholder = "Buscar…",
  prominent = false,
  compact = false,
}: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) =>
    normalizeSearch(option.label).includes(normalizeSearch(search.trim())),
  );
  const groups = [...new Set(filtered.map((option) => option.group || ""))];
  const close = () => {
    dialog.current?.close();
    trigger.current?.focus();
  };
  const open = () => {
    setSearch("");
    dialog.current?.showModal();
    input.current?.focus();
  };
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={`gx-picker ${prominent ? "gx-picker-prominent" : ""} ${compact ? "gx-picker-compact" : ""}`}
        aria-haspopup="dialog"
        aria-label={
          compact || prominent
            ? label
            : `${label}: ${selected?.label ?? "Seleccionar"}`
        }
        onClick={open}
      >
        {prominent && <MapPin size={21} aria-hidden="true" />}
        <span>
          {!compact && !prominent && (
            <span className="gx-control-label">{label}</span>
          )}
          <span className="gx-picker-value">
            {compact || prominent ? label : (selected?.label ?? "Seleccionar")}
          </span>
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        className="gx-dialog"
        aria-labelledby={`${id}-title`}
        onCancel={close}
        onClick={(event) => {
          if (event.target === dialog.current) {
            const box = dialog.current.getBoundingClientRect();
            if (
              event.clientX < box.left ||
              event.clientX > box.right ||
              event.clientY < box.top ||
              event.clientY > box.bottom
            )
              close();
          }
        }}
      >
        <div className="gx-dialog-head">
          <h2 id={`${id}-title`}>{title}</h2>
          <button
            type="button"
            className="gx-icon-button"
            aria-label="Cerrar selector"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        <div className="gx-search">
          <Search size={19} aria-hidden="true" />
          <input
            ref={input}
            aria-label={placeholder}
            placeholder={placeholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                results.current
                  ?.querySelector<HTMLButtonElement>("button")
                  ?.focus();
              }
            }}
          />
        </div>
        <div
          ref={results}
          className="gx-picker-results"
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            const buttons = Array.from(
              results.current?.querySelectorAll<HTMLButtonElement>("button") ??
                [],
            );
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            const next = index + (event.key === "ArrowDown" ? 1 : -1);
            if (next < 0) input.current?.focus();
            else buttons[next % buttons.length]?.focus();
          }}
        >
          {filtered.length === 0 && (
            <p className="gx-empty" role="status">
              No encontramos coincidencias. Prueba otro nombre.
            </p>
          )}
          {groups.map((group) => (
            <div key={group}>
              {group && <h3 className="gx-option-group">{group}</h3>}
              <ul>
                {filtered
                  .filter((option) => (option.group || "") === group)
                  .map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        className="gx-option"
                        aria-pressed={value === option.value}
                        onClick={() => {
                          onSelect(option.value);
                          close();
                        }}
                      >
                        <span>{option.label}</span>
                        {value === option.value && (
                          <Check size={18} aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </dialog>
    </>
  );
}
