import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import type { Prisma } from '@prisma/client';

export const ROLES = ['USER', 'ENGINEER', 'MODERATOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export type PartSide =
	| 'FRONT-LEFT'
	| 'FRONT-RIGHT'
	| 'REAR-LEFT'
	| 'REAR-RIGHT'
	| 'REAR-LEFT_RIGHT'
	| 'FRONT-LEFT_RIGHT'
	| 'FRONT & REAR';

export const PART_SIDES: { id: PartSide; name: string }[] = [
	{ id: 'FRONT-LEFT', name: 'Front Left' },
	{ id: 'FRONT-RIGHT', name: 'Front Right' },
	{ id: 'REAR-LEFT', name: 'Rear Left' },
	{ id: 'REAR-RIGHT', name: 'Rear Right' },
	{ id: 'FRONT-LEFT_RIGHT', name: 'Front Left Right' },
	{ id: 'REAR-LEFT_RIGHT', name: 'Rear Left Right' },
	{ id: 'FRONT & REAR', name: 'Front & Rear' }
];

export interface FilterType {
	partNumber: string;
	vProject: string;
	vProcess: string;
	scrapCode: string;
	description: string;
	dateFrom: string;
	dateTo: string;
}

export interface DataAndResultData<T> extends ResultInfoData {
	data: T[];
	totalPages: number;
}

export type LoggerActionType =
	| 'CREATE'
	| 'EDIT'
	| 'DELETE'
	| 'LOGIN'
	| 'LOGOUT'
	| 'VIEW'
	| 'EXPORT'
	| 'ASSIGN';

export type LoggerEntityType =
	| 'Hall'
	| 'Part'
	| 'Process'
	| 'Project'
	| 'ScrapCode'
	| 'Operator'
	| 'User'
	| 'ScrapRecord'
	| 'PartGroup'
	| 'LabelGroup';

export type PartGroupWithRelations = Prisma.PartGroupGetPayload<{
	include: {
		scrapCodes: true;
		materials: true;
	};
}>;

export type LabelGroupsWithRelations = Prisma.LabelGroupGetPayload<{
	include: {
		groups: { include: { materials: true } };
	};
}>;

export type ScrapRecordWithRelations = Prisma.ScrapRecordGetPayload<{
	include: { part: true; scrapCode: true };
}>;

export interface createScrapNoteType {
	partNumber: string;
	quantity: number;
	scrapCode: {
		sc: string;
		qnt: number;
	}[];
}

// export type LabelGroupsWithRelationsScan = Prisma.LabelGroupGetPayload<{
// 	include: {
// 		process: true;
// 		project: true;
// 		groups: {
// 			include: {
// 				parts: true;
// 			};
// 		};
// 	};
// }>;
