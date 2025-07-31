import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Card component props type
 */
export type CardProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Card container component
 * @param className - Additional CSS classes
 * @param props - Additional div props
 * @returns Card container
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm text-card-foreground shadow-lg transition-all duration-300 hover:shadow-xl hover:border-border/70",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

/**
 * Card header component props type
 */
export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Card header component
 * @param className - Additional CSS classes
 * @param props - Additional div props
 * @returns Card header
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

/**
 * Card title component props type
 */
export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>

/**
 * Card title component
 * @param className - Additional CSS classes
 * @param props - Additional heading props
 * @returns Card title
 */
export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

/**
 * Card description component props type
 */
export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

/**
 * Card description component
 * @param className - Additional CSS classes
 * @param props - Additional paragraph props
 * @returns Card description
 */
export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

/**
 * Card content component props type
 */
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Card content component
 * @param className - Additional CSS classes
 * @param props - Additional div props
 * @returns Card content
 */
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

/**
 * Card footer component props type
 */
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Card footer component
 * @param className - Additional CSS classes
 * @param props - Additional div props
 * @returns Card footer
 */
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter" 