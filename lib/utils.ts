import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SALT = "vpd";

export function encodeId(id: number | string): string {
  return btoa(`${SALT}${id}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeId(hash: string): string {
  const base64 = hash.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64).replace(SALT, "");
}
