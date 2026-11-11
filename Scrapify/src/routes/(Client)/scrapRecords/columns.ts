import type { Prisma } from '@prisma/client';
import type { XlsxColumn } from '@/utils/xlsx.server';
import { dateTimeLocalTimeDb } from '@/utils/index';
import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';

export type ScrapRecordRow = Prisma.ScrapRecordGetPayload<{ include: { partGroup: true } }>;

export type ScrapRecordType = 'Scrap' | 'Rebuild' | 'Quantity scrap';

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

/** One data field of a scrap record: its label and its value in the Excel export. */
export type ScrapRecordColumn = {
	key: ScrapRecordColumnKey;
	label: string;
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

/** Data fields in table order; the export writes each one as its own column. */
export const scrapRecordColumns: readonly ScrapRecordColumn[] = [
	{ key: 'id', label: 'ID', exportValue: (r) => r.id },
	{ key: 'dmc', label: 'DMC', exportValue: (r) => r.dmc },
	{ key: 'type', label: 'Type', exportValue: scrapRecordType },
	{ key: 'partGroup', label: 'Part group', exportValue: (r) => r.partGroup.name },
	{ key: 'project', label: 'Project', exportValue: (r) => r.partGroup.vProject ?? null },
	{ key: 'scrapCode', label: 'Scrap code', exportValue: (r) => r.scrapCode ?? null },
	{ key: 'description', label: 'Description', exportValue: (r) => r.scrapCodeDescription ?? null },
	{
		key: 'otherComponent',
		label: 'Other component',
		exportValue: (r) => yesNo(r.isOtherComponent)
	},
	{ key: 'otherVariant', label: 'Other variant', exportValue: (r) => yesNo(isOtherVariant(r)) },
	{
		key: 'replacementPart',
		label: 'Replacement part',
		exportValue: (r) => r.replacementPartMaterial?.trim() || null
	},
	{ key: 'quantity', label: 'Quantity', exportValue: (r) => r.quantity },
	{ key: 'createdBy', label: 'Created by', exportValue: (r) => r.createdBy },
	{ key: 'createdAt', label: 'Created at', exportValue: (r) => dateTimeLocalTimeDb(r.createdAt) }
];

export type ScrapRecordTableColumnKey =
	| 'id'
	| 'dmc'
	| 'type'
	| 'part'
	| 'reason'
	| 'flags'
	| 'replacementPart'
	| 'quantity'
	| 'createdBy'
	| 'createdAt';

export type ScrapRecordColumnGroup =
	| 'identification'
	| 'type'
	| 'part'
	| 'reason'
	| 'variant'
	| 'quantity'
	| 'audit';

/** A table column; it can show several data fields stacked in one cell. */
export type ScrapRecordTableColumn = {
	key: ScrapRecordTableColumnKey;
	/** Data fields shown in the cell; the first is the main line, the rest are secondary. */
	fields: readonly ScrapRecordColumnKey[];
	group: ScrapRecordColumnGroup;
	/** ID and DMC identify a record, so they cannot be hidden. */
	hideable: boolean;
	/** Tailwind width class; '' = flexible column that takes the remaining width. */
	widthClass: string;
};

/** Table order and layout; header labels come from the data fields above. */
export const scrapRecordTableColumns: readonly ScrapRecordTableColumn[] = [
	{ key: 'id', fields: ['id'], group: 'identification', hideable: false, widthClass: 'w-14' },
	{ key: 'dmc', fields: ['dmc'], group: 'identification', hideable: false, widthClass: 'w-52' },
	{ key: 'type', fields: ['type'], group: 'type', hideable: true, widthClass: 'w-36' },
	{
		key: 'part',
		fields: ['partGroup', 'project'],
		group: 'part',
		hideable: true,
		widthClass: 'w-44'
	},
	{
		key: 'reason',
		fields: ['scrapCode', 'description'],
		group: 'reason',
		hideable: true,
		// No fixed width: in the fixed table layout this column absorbs the spare width,
		// so the other columns keep their exact widths (the sticky DMC offset relies on it).
		widthClass: ''
	},
	{
		key: 'flags',
		fields: ['otherComponent', 'otherVariant'],
		group: 'variant',
		hideable: true,
		widthClass: 'w-40'
	},
	{
		key: 'replacementPart',
		fields: ['replacementPart'],
		group: 'variant',
		hideable: true,
		widthClass: 'w-36'
	},
	{ key: 'quantity', fields: ['quantity'], group: 'quantity', hideable: true, widthClass: 'w-20' },
	{ key: 'createdBy', fields: ['createdBy'], group: 'audit', hideable: true, widthClass: 'w-28' },
	{ key: 'createdAt', fields: ['createdAt'], group: 'audit', hideable: true, widthClass: 'w-32' }
];

const labelByKey = new Map(scrapRecordColumns.map((column) => [column.key, column.label]));

/** Header labels of a table column: main label first, secondary labels after. */
export function tableColumnLabels(column: ScrapRecordTableColumn): string[] {
	return column.fields.map((field) => labelByKey.get(field) ?? field);
}
