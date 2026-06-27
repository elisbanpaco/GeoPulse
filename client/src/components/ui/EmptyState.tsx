"use client";

import React, { type ReactNode } from "react";
import { SearchX } from "lucide-react";

// ============================================
// GeoPulse — Empty State Component
// ============================================

interface EmptyStateProps {
  /** Custom icon to display. Defaults to SearchX from lucide-react. */
  icon?: ReactNode;
  /** Primary title text */
  title: string;
  /** Descriptive text below the title */
  description: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Optional action button callback */
  onAction?: () => void;
}

/**
 * EmptyState
 * Centered placeholder shown when a section has no data.
 * Supports a custom icon, title, description, and an optional CTA button.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
      {/* Icon */}
      <div className="mb-1">
        {icon ?? (
          <SearchX
            size={48}
            className="text-[#94a3b8]"
            strokeWidth={1.5}
          />
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-[#334155]">
        {title}
      </h3>

      {/* Description */}
      <p className="text-xs text-[#94a3b8] max-w-xs leading-relaxed">
        {description}
      </p>

      {/* Optional action button */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 active:bg-teal-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
