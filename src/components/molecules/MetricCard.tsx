import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card";
import { cn } from "@/lib/utils";

/**
 * MetricCard component props interface
 */
export interface MetricCardProps {
  /** Title of the metric */
  title: string;
  /** Value to display */
  value: string | number;
  /** Description or subtitle */
  description?: string;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show a special highlight */
  highlight?: boolean;
  /** Color variant for the card */
  variant?: "default" | "success" | "warning" | "danger";
}

/**
 * Metric card component for displaying statistics
 * @param title - Title of the metric
 * @param value - Value to display
 * @param description - Description or subtitle
 * @param icon - Icon to display
 * @param className - Additional CSS classes
 * @param highlight - Whether to show a special highlight
 * @param variant - Color variant for the card
 * @returns MetricCard component
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  className,
  highlight = false,
  variant = "default",
}) => {
  const variantStyles = {
    default: "border-white bg-card",
    success: "border-green-200 bg-green-50 text-green-900",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  };

  // Check if custom styling is provided
  const hasCustomStyling =
    className &&
    (className.includes("bg-gradient") ||
      className.includes("text-white") ||
      className.includes("text-black"));

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        highlight && "ring-2 ring-primary/20 shadow-lg",
        // Only apply variant styles if no custom styling is provided
        !hasCustomStyling && variantStyles[variant],
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle
          className={cn(
            "text-sm font-medium",
            hasCustomStyling
              ? "text-white/90"
              : variant === "default"
              ? "text-muted-foreground"
              : "text-current"
          )}
        >
          {title}
        </CardTitle>
        {icon && (
          <div
            className={cn(
              "h-4 w-4",
              hasCustomStyling
                ? "text-white"
                : variant === "default"
                ? "text-muted-foreground"
                : "text-current"
            )}
          >
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold",
            hasCustomStyling
              ? "text-white"
              : variant === "default"
              ? "text-foreground"
              : "text-current"
          )}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {description && (
          <p
            className={cn(
              "text-xs mt-1",
              hasCustomStyling
                ? "text-white/70"
                : variant === "default"
                ? "text-muted-foreground"
                : "text-current/70"
            )}
          >
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
