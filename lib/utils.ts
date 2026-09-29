import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function sumBy<T>(items: readonly T[], value: (item: T) => number): number {
  return items.reduce((sum, item) => sum + value(item), 0);
}
