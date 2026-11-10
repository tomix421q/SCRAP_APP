import { browser } from '$app/environment';
import type { ScrapMode } from '../../routes/(Client)/scandmclabel/_components/ScrapManager.svelte';

export type GridSize = 1 | 2 | 3 | 4;

const STORAGE_KEY = 'gridByMode';

// Single source of truth for allowed grid sizes per mode
export const GRID_OPTIONS: Record<ScrapMode, readonly GridSize[]> = {
	rebuild: [1, 2, 3, 4],
	scrap: [1, 2, 3, 4],
	qntScrap: [1, 2]
};

const DEFAULT_GRID: Record<ScrapMode, GridSize> = {
	rebuild: 2,
	scrap: 2,
	qntScrap: 1
};

// Full literals so Tailwind can detect the classes
export const GRID_COLS_CLASS: Record<GridSize, string> = {
	1: 'md:grid-cols-1',
	2: 'md:grid-cols-2',
	3: 'md:grid-cols-3',
	4: 'md:grid-cols-4'
};

class ViewStore {
	grid = $state<Record<ScrapMode, GridSize>>({ ...DEFAULT_GRID });

	constructor() {
		if (!browser) return;
		try {
			const stored: Partial<Record<ScrapMode, unknown>> = JSON.parse(
				localStorage.getItem(STORAGE_KEY) ?? '{}'
			);
			for (const mode of Object.keys(GRID_OPTIONS) as ScrapMode[]) {
				const value = stored[mode];
				if (GRID_OPTIONS[mode].includes(value as GridSize)) this.grid[mode] = value as GridSize;
			}
		} catch {
			// Corrupted storage value, keep defaults
		}
	}

	setGrid(mode: ScrapMode, size: GridSize) {
		this.grid[mode] = size;
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.grid));
	}
}

export const viewStore = new ViewStore();
