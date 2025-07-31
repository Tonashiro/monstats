import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Skeleton component props interface
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the skeleton should be animated */
  animated?: boolean
  /** Custom width for the skeleton */
  width?: string | number
  /** Custom height for the skeleton */
  height?: string | number
  /** Whether to show a rounded skeleton */
  rounded?: boolean
}

/**
 * Skeleton loading component with shimmer animation
 * @param className - Additional CSS classes
 * @param animated - Whether to show shimmer animation
 * @param width - Custom width
 * @param height - Custom height
 * @param rounded - Whether to show rounded corners
 * @param ...props - Additional HTML div props
 * @returns Skeleton component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  animated = true,
  width,
  height,
  rounded = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "skeleton",
        animated && "animate-pulse-slow",
        rounded && "rounded-full",
        !rounded && "rounded-md",
        className
      )}
      style={{
        width: width,
        height: height,
      }}
      {...props}
    />
  )
}

/**
 * Card skeleton component for loading card states
 * @param className - Additional CSS classes
 * @returns CardSkeleton component
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

/**
 * Metric card skeleton component
 * @param className - Additional CSS classes
 * @returns MetricCardSkeleton component
 */
export const MetricCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

/**
 * Chart skeleton component
 * @param className - Additional CSS classes
 * @returns ChartSkeleton component
 */
export const ChartSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-12 rounded-md" />
          <Skeleton className="h-8 w-12 rounded-md" />
          <Skeleton className="h-8 w-12 rounded-md" />
        </div>
      </div>
      <div className="h-64 w-full">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  )
} 