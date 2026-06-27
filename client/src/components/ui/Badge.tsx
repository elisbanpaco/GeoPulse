"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ============================================
// GeoPulse — Badge Component
// ============================================

type BadgeVariant = "critical" | "high" | "medium" | "success" | "neutral";

interface BadgeProps {
  /** Semantic color variant */
  variant: BadgeVariant;
  /** Badge content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Badge
 * Compact label for severity, status, or category indicators.
 * Styled via gp-badge + gp-badge-{variant} CSS classes.
 */
export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "gp-badge",
        `gp-badge-${variant}`,
        className
      )}
    >
      {children}
    </span>
  );
}
