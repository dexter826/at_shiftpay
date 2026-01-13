import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Kết hợp các class Tailwind và xử lý xung đột.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
