import { writable } from 'svelte/store';

export const currentConfirmDeleteId = writable<number | undefined>(undefined);
