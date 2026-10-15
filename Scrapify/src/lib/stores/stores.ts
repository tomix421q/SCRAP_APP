import { browser } from '$app/environment';
import {
	type createScrapNoteType,
	type PartGroupWithRelations,
	type ProcessWithRelationsAll,
	type ScrapRecordWithRelations
} from '@/utils/types';
import type { Hall, Part, Project, ScrapCode } from '@prisma/client';
import { derived, writable, type Readable } from 'svelte/store';

export const currentConfirmDeleteId = writable<number | string | undefined>(undefined);

export const editHallData = writable<Hall | undefined>(undefined);
export const editProjectData = writable<Project | undefined>(undefined);
export const editProcessData = writable<ProcessWithRelationsAll | undefined>(undefined);
export const editPartData = writable<Part | undefined>(undefined);
export const editScrapData = writable<ScrapCode | undefined>(undefined);
export const editSearchData = writable<ScrapRecordWithRelations | undefined>(undefined);
export const editPartGroupData = writable<PartGroupWithRelations | undefined>(undefined);

export const isEditing: Readable<boolean> = derived(
	[
		editHallData,
		editProjectData,
		editProcessData,
		editPartData,
		editScrapData,
		editSearchData,
		editPartGroupData
	],
	([
		$editHallData,
		$editProjectData,
		$editProcessData,
		$editPartData,
		$editScrapData,
		$editSearchData,
		$editPartGroupData
	]: any) => {
		return (
			$editHallData !== undefined ||
			$editProjectData !== undefined ||
			$editProcessData !== undefined ||
			$editPartData !== undefined ||
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

