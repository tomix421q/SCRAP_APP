import {
	type createScrapNoteType,
	type LabelGroupsWithRelations,
	type PartGroupWithRelations,
	type ScrapRecordWithRelations
} from '@/utils/types';
import type { vScrapCodes } from '@prisma/client';
import { derived, writable, type Readable } from 'svelte/store';

export const currentConfirmDeleteId = writable<number | string | undefined>(undefined);

export const editSearchData = writable<ScrapRecordWithRelations | undefined>(undefined);
export const editPartGroupData = writable<PartGroupWithRelations | undefined>(undefined);
export const editLabelGroupsData = writable<LabelGroupsWithRelations | undefined>(undefined);

export const isEditing: Readable<boolean> = derived(
	[editSearchData, editPartGroupData, editLabelGroupsData],
	([$editScrapData, $editSearchData, $editPartGroupData]: any) => {
		return (
			$editScrapData !== undefined ||
			$editPartGroupData !== undefined ||
			$editSearchData !== undefined
		);
	}
);

// FAVORITE STORE
export const favoriteProcesses = writable<{ id: string; name: string }[]>([]);

// CREATE SCRAP NOTES
export const createScrapNotesStore = writable<createScrapNoteType[]>([]);

// OPERATOR CARD
export const operatorCardId = writable<string>('');
