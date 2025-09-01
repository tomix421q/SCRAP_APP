import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export function getUserInitial(name: string) {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('');
}

export type WithElementRef<T> = T & { ref?: HTMLElement | null };
