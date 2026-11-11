// Builds .xlsx files. The .server suffix keeps it out of client bundles; client code
// may still use `import type` (erased at compile time).
import * as XLSX from 'xlsx';

/** A single cell value; `null` becomes an empty cell. */
export type XlsxCellValue = string | number | boolean | Date | null;

/**
 * Column definition for xlsx export. Kept generic so it can later carry
 * an import mapping (header <-> key) without changing existing callers.
 */
export type XlsxColumn<T> = {
	header: string;
	value: (row: T) => XlsxCellValue;
};

const xlsxDateFormat = 'yyyy-mm-dd hh:mm';
const xlsxContentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Builds a single-sheet workbook: a header row followed by one row per item.
 * Numbers, booleans and dates keep their cell type; `null` leaves the cell empty.
 */
export function buildXlsx<T>(
	rows: readonly T[],
	columns: readonly XlsxColumn<T>[],
	sheetName: string
): Buffer {
	const data: XlsxCellValue[][] = [
		columns.map((column) => column.header),
		...rows.map((row) => columns.map((column) => column.value(row)))
	];
	// Dates are stored as Excel serial numbers with a date format (local wall-clock time),
	// which every spreadsheet app reads as a real date cell.
	const sheet = XLSX.utils.aoa_to_sheet(data, { dateNF: xlsxDateFormat });
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
	return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

/** Wraps an xlsx buffer in a download response. */
export function xlsxResponse(buffer: Buffer, fileName: string): Response {
	const safeFileName = fileName.replace(/["\\\r\n]/g, '_');
	return new Response(new Uint8Array(buffer), {
		headers: {
			'Content-Type': xlsxContentType,
			'Content-Disposition': `attachment; filename="${safeFileName}"`
		}
	});
}
