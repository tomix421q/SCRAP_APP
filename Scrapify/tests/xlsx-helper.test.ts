import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildXlsx, xlsxResponse, type XlsxColumn } from '../src/lib/utils/xlsx.server';

type Row = { name: string; count: number; active: boolean; at: Date; note: string | null };

const columns: XlsxColumn<Row>[] = [
	{ header: 'Name', value: (row) => row.name },
	{ header: 'Count', value: (row) => row.count },
	{ header: 'Active', value: (row) => row.active },
	{ header: 'At', value: (row) => row.at },
	{ header: 'Note', value: (row) => row.note }
];

function readSheet(buffer: Buffer) {
	const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellNF: true });
	return { workbook, sheet: workbook.Sheets[workbook.SheetNames[0]] };
}

describe('buildXlsx', () => {
	it('writes the header in column order and typed cells per row', () => {
		const at = new Date(2026, 0, 15, 8, 30);
		const buffer = buildXlsx(
			[{ name: 'A', count: 2.5, active: true, at, note: null }],
			columns,
			'Records'
		);
		const { workbook, sheet } = readSheet(buffer);

		expect(workbook.SheetNames).toEqual(['Records']);
		expect(['A1', 'B1', 'C1', 'D1', 'E1'].map((ref) => sheet[ref]?.v)).toEqual([
			'Name',
			'Count',
			'Active',
			'At',
			'Note'
		]);
		expect(sheet.A2).toMatchObject({ t: 's', v: 'A' });
		expect(sheet.B2).toMatchObject({ t: 'n', v: 2.5 });
		expect(sheet.C2).toMatchObject({ t: 'b', v: true });
		expect(sheet.D2.t).toBe('d');
		expect(sheet.D2.z).toBe('yyyy-mm-dd hh:mm');
		const readAt = sheet.D2.v as Date;
		expect([
			readAt.getFullYear(),
			readAt.getMonth(),
			readAt.getDate(),
			readAt.getHours(),
			readAt.getMinutes()
		]).toEqual([2026, 0, 15, 8, 30]);
		expect(sheet.E2).toBeUndefined();
	});

	it('empty rows produce a sheet with the header only', () => {
		const { sheet } = readSheet(buildXlsx([], columns, 'Empty'));
		expect(sheet['!ref']).toBe('A1:E1');
		expect(sheet.A1.v).toBe('Name');
	});
});

describe('xlsxResponse', () => {
	it('returns the file as an xlsx attachment', async () => {
		const buffer = buildXlsx([], columns, 'Sheet');
		const response = xlsxResponse(buffer, 'report_2026-01-15.xlsx');

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe(
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		);
		expect(response.headers.get('content-disposition')).toBe(
			'attachment; filename="report_2026-01-15.xlsx"'
		);
		expect(Buffer.from(await response.arrayBuffer()).equals(buffer)).toBe(true);
	});
});
