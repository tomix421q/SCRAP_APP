import {
	type createScrapNoteType,
	type LabelGroupsWithRelations,
	type PartGroupWithRelations
} from '@/utils/types';

import { derived, writable, type Readable } from 'svelte/store';

export const currentConfirmDeleteId = writable<number | string | undefined>(undefined);

export const editPartGroupData = writable<PartGroupWithRelations | undefined>(undefined);
export const editLabelGroupsData = writable<LabelGroupsWithRelations | undefined>(undefined);

export const isEditing: Readable<boolean> = derived(
	[editPartGroupData, editLabelGroupsData],
	([$editPartGroupData, $editLabelGroupsData]) =>
		$editPartGroupData !== undefined || $editLabelGroupsData !== undefined
);

// FAVORITE STORE
export const favoriteProcesses = writable<{ id: string; name: string }[]>([]);

// CREATE SCRAP NOTES
export const createScrapNotesStore = writable<createScrapNoteType[]>([]);

// OPERATOR CARD
export const operatorCardId = writable<string>('');
