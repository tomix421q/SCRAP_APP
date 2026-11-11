import type { Prisma } from '@prisma/client';
import type { XlsxColumn } from '@/utils/xlsx';
import { dateTimeLocalTimeDb } from '@/utils/index';
import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';

export type ScrapRecordRow = Prisma.ScrapRecordGetPayload<{ include: { partGroup: true } }>;

export type ScrapRecordType = 'Scrap' | 'Rebuild' | 'Quantity scrap';

export type ScrapRecordColumnGroup =
	| 'identification'
	| 'type'
	| 'part'
	| 'reason'
	| 'variant'
	| 'quantity'
	| 'audit';

export type ScrapRecordColumnKey =
	| 'id'
	| 'dmc'
	| 'type'
	| 'partGroup'
	| 'project'
	| 'scrapCode'
	| 'description'
	| 'otherComponent'
	| 'otherVariant'
	| 'replacementPart'
	| 'quantity'
	| 'createdBy'
	| 'createdAt';

export type ScrapRecordColumn = {
	key: ScrapRecordColumnKey;
	label: string;
	group: ScrapRecordColumnGroup;
	/** ID and DMC identify a record, so they cannot be hidden. */
	hideable: boolean;
	widthClass: string;
	exportValue: XlsxColumn<ScrapRecordRow>['value'];
};

/** Other variant is not stored; a record has one when a replacement part was chosen. */
export function isOtherVariant(record: Pick<ScrapRecordRow, 'replacementPartMaterial'>) {
	return Boolean(record.replacementPartMaterial?.trim());
}

export function scrapRecordType(
	record: Pick<ScrapRecordRow, 'dmc' | 'isRebuild'>
): ScrapRecordType {
	if (record.dmc.startsWith(quantityScrapLabelPrefix)) return 'Quantity scrap';
	return record.isRebuild ? 'Rebuild' : 'Scrap';
}

const yesNo = (value: boolean) => (value ? 'Yes' : 'No');

/** Single source of truth for table order, headers, groups and export columns. */
export const scrapRecordColumns: readonly ScrapRecordColumn[] = [
	{
		key: 'id',
		label: 'ID',
		group: 'identification',
		hideable: false,
		widthClass: 'w-14',
		exportValue: (r) => r.id
	},
	{
		key: 'dmc',
		label: 'DMC',
		group: 'identification',
		hideable: false,
		widthClass: 'w-36',
		exportValue: (r) => r.dmc
	},
	{
		key: 'type',
		label: 'Type',
		group: 'type',
		hideable: true,
		widthClass: 'w-28',
		exportValue: scrapRecordType
	},
	{
		key: 'partGroup',
		label: 'Part group',
		group: 'part',
		hideable: true,
		widthClass: 'w-32',
		exportValue: (r) => r.partGroup.name
	},
	{
		key: 'project',
		label: 'Project',
		group: 'part',
		hideable: true,
		widthClass: 'w-24',
		exportValue: (r) => r.partGroup.vProject ?? null
	},
	{
		key: 'scrapCode',
		label: 'Scrap code',
		group: 'reason',
		hideable: true,
		widthClass: 'w-24',
		exportValue: (r) => r.scrapCode ?? null
	},
	{
		key: 'description',
		label: 'Description',
		group: 'reason',
		hideable: true,
		widthClass: 'w-28',
		exportValue: (r) => r.scrapCodeDescription ?? null
	},
	{
		key: 'otherComponent',
		label: 'Other component',
		group: 'variant',
		hideable: true,
		widthClass: 'w-32',
		exportValue: (r) => yesNo(r.isOtherComponent)
	},
	{
		key: 'otherVariant',
		label: 'Other variant',
		group: 'variant',
		hideable: true,
		widthClass: 'w-28',
		exportValue: (r) => yesNo(isOtherVariant(r))
	},
	{
		key: 'replacementPart',
		label: 'Replacement part',
		group: 'variant',
		hideable: true,
		widthClass: 'w-36',
		exportValue: (r) => r.replacementPartMaterial?.trim() || null
	},
	{
		key: 'quantity',
		label: 'Quantity',
		group: 'quantity',
		hideable: true,
		widthClass: 'w-20',
		exportValue: (r) => r.quantity
	},
	{
		key: 'createdBy',
		label: 'Created by',
		group: 'audit',
		hideable: true,
		widthClass: 'w-24',
		exportValue: (r) => r.createdBy
	},
	{
		key: 'createdAt',
		label: 'Created at',
		group: 'audit',
		hideable: true,
		widthClass: 'w-40',
		exportValue: (r) => dateTimeLocalTimeDb(r.createdAt)
	}
];
