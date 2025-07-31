import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number with K, M, B suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + "B";
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + "M";
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + "K";
  }
  return num.toFixed(0);
}

/**
 * Format MON token amounts with appropriate precision
 */
export function formatMON(amount: number): string {
  if (amount >= 1e9) {
    return (amount / 1e9).toFixed(1) + "B";
  }
  if (amount >= 1e6) {
    return (amount / 1e6).toFixed(1) + "M";
  }
  if (amount >= 1e3) {
    return (amount / 1e3).toFixed(1) + "K";
  }
  if (amount >= 1) {
    return amount.toFixed(2);
  }
  if (amount >= 0.01) {
    return amount.toFixed(4);
  }
  return amount.toFixed(6);
}

/**
 * Check if date is Monad launch day (February 19, 2025)
 */
export function isDay1(date: Date): boolean {
  const launchDate = new Date("2025-02-19T00:00:00Z");
  return date.toDateString() === launchDate.toDateString();
}

/**
 * Get Monad launch date timestamp
 */
export function getLaunchDate(): number {
  return new Date("2025-02-19T00:00:00Z").getTime() / 1000;
}
