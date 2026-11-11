import { error } from '@sveltejs/kit';
import type { Prisma } from '@prisma/client';
import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';

export type ScrapRecordCategory = 'all' | 'rebuild' | 'scrap' | 'quantity';
export type ScrapRecordSubCategory = Exclude<ScrapRecordCategory, 'all'>;

export type ScrapRecordFilters = {
	category: ScrapRecordCategory;
	/** Selected project; the page also uses it to narrow part group and scrap code options. */
	project: string | undefined;
	/** Where clause for the selected category. */
	where: Prisma.ScrapRecordWhereInput;
	/** Where clause for a specific category, used for the category summaries. */
	whereFor: (category: ScrapRecordSubCategory) => Prisma.ScrapRecordWhereInput;
};

function parseDate(value: string | null, field: string) {
	if (!value) return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw error(400, { message: `Invalid ${field} date filter.` });
	}
	return date;
}

function parseBooleanFilter(value: string | null, field: string) {
	if (!value) return undefined;
	if (value === 'true') return true;
	if (value === 'false') return false;
	throw error(400, { message: `Invalid ${field} filter.` });
}

function parseCategory(value: string | null): ScrapRecordCategory {
	const category = value ?? 'all';
	switch (category) {
		case 'all':
		case 'rebuild':
		case 'scrap':
		case 'quantity':
			return category;
		default:
			throw error(400, { message: 'Invalid scrap record category.' });
	}
}

/**
 * Parses the scrap records query string (shared by the page load and the export)
 * into Prisma where clauses. Throws a 400 error for invalid filter values.
 */
export function parseScrapRecordFilters(params: URLSearchParams): ScrapRecordFilters {
	const commonConditions: Prisma.ScrapRecordWhereInput[] = [];
	const dmc = params.get('dmc')?.trim();
	const scrapCode = params.get('scrapCode')?.trim();
	const partGroup = params.get('partGroup')?.trim();
	const project = params.get('project')?.trim() || undefined;
	const createdBy = params.get('createdBy')?.trim();
	const replacementPart = params.get('replacementPart')?.trim();
	const dateFrom = parseDate(params.get('dateFrom'), 'from');
	const dateTo = parseDate(params.get('dateTo'), 'to');
	const dateToExclusive = dateTo ? new Date(dateTo.getTime() + 60_000) : undefined;
	const isOtherComponent = parseBooleanFilter(params.get('otherComponent'), 'other component');
	const isOtherVariant = parseBooleanFilter(params.get('otherVariant'), 'other variant');
	const exported = parseBooleanFilter(params.get('exported'), 'exported');
	const category = parseCategory(params.get('category'));

	if (dateFrom && dateTo && dateFrom > dateTo) {
		throw error(400, { message: 'The start date must be before the end date.' });
	}
	if (dmc) commonConditions.push({ dmc: { contains: dmc } });
	if (scrapCode) commonConditions.push({ scrapCode: { contains: scrapCode } });
	if (partGroup) {
		commonConditions.push({ partGroup: { is: { name: { contains: partGroup } } } });
	}
	if (project) commonConditions.push({ partGroup: { is: { vProject: project } } });
	if (createdBy) commonConditions.push({ createdBy: { contains: createdBy } });
	if (dateFrom || dateTo) {
		commonConditions.push({
			createdAt: {
				...(dateFrom ? { gte: dateFrom } : {}),
				...(dateToExclusive ? { lt: dateToExclusive } : {})
			}
		});
	}
	if (isOtherComponent !== undefined) commonConditions.push({ isOtherComponent });
	// Other variant is derived: a record has one when a replacement part was chosen.
	// An empty string is treated the same as null. SQL Server ignores trailing spaces
	// in `=`, so whitespace-only values also match '' (consistent with `isOtherVariant`).
	if (isOtherVariant === true) {
		commonConditions.push(
			{ replacementPartMaterial: { not: null } },
			{ NOT: { replacementPartMaterial: '' } }
		);
	}
	if (isOtherVariant === false) {
		commonConditions.push({
			OR: [{ replacementPartMaterial: null }, { replacementPartMaterial: '' }]
		});
	}
	if (replacementPart) {
		commonConditions.push({ replacementPartMaterial: { contains: replacementPart } });
	}
	if (exported === true) commonConditions.push({ QADExported: true });
	if (exported === false) {
		commonConditions.push({ OR: [{ QADExported: false }, { QADExported: null }] });
	}

	const whereFor = (subCategory: ScrapRecordSubCategory): Prisma.ScrapRecordWhereInput => {
		const categoryConditions: Prisma.ScrapRecordWhereInput[] = [...commonConditions];
		if (subCategory === 'quantity') {
			categoryConditions.push({ dmc: { startsWith: quantityScrapLabelPrefix } });
		} else {
			categoryConditions.push({ NOT: { dmc: { startsWith: quantityScrapLabelPrefix } } });
			categoryConditions.push({ isRebuild: subCategory === 'rebuild' });
		}
		return { AND: categoryConditions };
	};

	const where: Prisma.ScrapRecordWhereInput =
		category === 'all' ? { AND: commonConditions } : whereFor(category);

	return { category, project, where, whereFor };
}
