import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely, resolving conflicting utility
 * classes (e.g. "p-2 p-4" -> "p-4") after conditional joining.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
