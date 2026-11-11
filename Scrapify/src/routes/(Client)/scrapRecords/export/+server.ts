import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prismaClient from '@/server/prisma';
import { writeToLogger } from '@/utils/serverHelp';
import { buildXlsx, xlsxResponse, type XlsxColumn } from '@/utils/xlsx.server';
import { parseScrapRecordFilters } from '../filters.server';
import { scrapRecordColumns, type ScrapRecordRow } from '../columns';

const maxExportRows = 50_000;

const exportColumns: XlsxColumn<ScrapRecordRow>[] = scrapRecordColumns.map((column) => ({
	header: column.label,
	value: column.exportValue
}));

function localDateStamp(date: Date) {
	const pad = (value: number) => String(value).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Exports every scrap record matching the page filters (query string) to .xlsx. */
export const GET: RequestHandler = async (event) => {
	const { where } = parseScrapRecordFilters(event.url.searchParams);

	let total = 0;
	let records: ScrapRecordRow[] | null = null;
	try {
		total = await prismaClient.scrapRecord.count({ where });
		if (total <= maxExportRows) {
			records = await prismaClient.scrapRecord.findMany({
				where,
				include: { partGroup: true },
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
			});
		}
	} catch (err) {
		console.error('Failed to load scrap records for export:', err);
		throw error(500, { message: 'Export failed. Please try again later.' });
	}
	if (!records) {
		throw error(400, {
			message: `Too many records to export (${total}). Narrow the filters to at most ${maxExportRows} records.`
		});
	}

	const buffer = buildXlsx(records, exportColumns, 'Scrap records');

	// Logging must never block the download (writeToLogger can also throw on the session lookup).
	try {
		const logResult = await writeToLogger({
			request: event.request,
			action: 'EXPORT',
			entityType: 'ScrapRecord'
		});
		if (logResult && !logResult.success) {
			console.error('Failed to log scrap record export:', logResult.error);
		}
	} catch (err) {
		console.error('Failed to log scrap record export:', err);
	}

	return xlsxResponse(buffer, `scrap_records_${localDateStamp(new Date())}.xlsx`);
};
