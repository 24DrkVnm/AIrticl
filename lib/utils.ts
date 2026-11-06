import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function calculateReadingTime(text: string): { words: number; chars: number; minutes: number } {
  const clean = text.replace(/<[^>]*>/g, " ").trim();
  if (!clean) return { words: 0, chars: 0, minutes: 0 };
  
  // Support both space-delimited words and CJK characters
  const words = clean.split(/\s+/).filter(Boolean).length;
  const chars = clean.length;
  // Estimate ~200 words per minute for latin scripts or ~400 characters per minute for CJK
  const minutes = Math.max(1, Math.ceil(words / 200));
  return { words, chars, minutes };
}
