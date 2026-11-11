import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';

// Prisma and auth are fully mocked: these tests must never touch a real database.
const authState = vi.hoisted(() => ({ fail: false }));

const prismaMock = vi.hoisted(() => ({
	scrapRecord: { findMany: vi.fn(), count: vi.fn() },
	activityLogs: { create: vi.fn() }
}));

vi.mock('@/server/prisma', () => ({ default: prismaMock }));
vi.mock('@/auth/auth', () => ({
	auth: {
		api: {
			getSession: vi.fn(async () => {
				if (authState.fail) throw new Error('session store down');
				return { user: { id: 'u1' }, session: { id: 's1' } };
			})
		}
	}
}));

import { GET } from '../src/routes/(Client)/scrapRecords/export/+server';

const baseRecord = {
	id: 7,
	dmc: 'DMC-1',
	partGroupId: 1,
	scrapCode: 'S10',
	scrapCodeDescription: 'Crack',
	isRebuild: false,
	isOtherComponent: true,
	quantity: 3,
	description: null,
	createdBy: 'john',
	// DB stores local wall-clock time (GETDATE()), Prisma reads it as UTC.
	createdAt: new Date(Date.UTC(2026, 0, 15, 8, 5)),
	QADExported: false,
	replacementPartMaterial: 'P-777',
	partGroup: { id: 1, name: 'Bumper', vProject: 'PRJ1' }
};

async function runExport(query = '') {
	const url = new URL(`http://localhost/scrapRecords/export?${query}`);
	return GET({ url, request: new Request(url) } as never);
}

async function readRows(response: Response) {
	const workbook = XLSX.read(Buffer.from(await response.arrayBuffer()), { type: 'buffer' });
	const sheet = workbook.Sheets[workbook.SheetNames[0]];
	return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
}

const header = [
	'ID',
	'DMC',
	'Type',
	'Part group',
	'Project',
	'Scrap code',
	'Description',
	'Other component',
	'Other variant',
	'Replacement part',
	'Quantity',
	'Created by',
	'Created at'
];

beforeEach(() => {
	vi.clearAllMocks();
	vi.useRealTimers();
	authState.fail = false;
	prismaMock.scrapRecord.count.mockResolvedValue(1);
	prismaMock.scrapRecord.findMany.mockResolvedValue([baseRecord]);
	prismaMock.activityLogs.create.mockResolvedValue({});
});

describe('scrap records export', () => {
	it('returns an xlsx attachment named with the export date', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date(2026, 10, 11, 9, 0));
		const response = await runExport();
		expect(response.headers.get('content-type')).toBe(
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		);
		expect(response.headers.get('content-disposition')).toBe(
			'attachment; filename="scrap_records_2026-11-11.xlsx"'
		);
	});

	it('writes all columns in table order with export values', async () => {
		prismaMock.scrapRecord.findMany.mockResolvedValue([
			baseRecord,
			{
				...baseRecord,
				id: 8,
				dmc: 'QNT-SCRAP-1',
				isOtherComponent: false,
				replacementPartMaterial: null,
				scrapCode: null,
				quantity: 2.5
			},
			{ ...baseRecord, id: 9, isRebuild: true, replacementPartMaterial: '' }
		]);
		const rows = await readRows(await runExport());

		expect(rows[0]).toEqual(header);
		expect(rows[1]).toEqual([
			7,
			'DMC-1',
			'Scrap',
			'Bumper',
			'PRJ1',
			'S10',
			'Crack',
			'Yes',
			'Yes',
			'P-777',
			3,
			'john',
			'15. 01. 2026 08:05:00'
		]);
		expect(rows[2]).toMatchObject({
			2: 'Quantity scrap',
			5: null,
			7: 'No',
			8: 'No',
			9: null,
			10: 2.5
		});
		expect(rows[3]).toMatchObject({ 2: 'Rebuild', 8: 'No', 9: null });
	});

	it('uses the same filters as the page and loads every matching record', async () => {
		await runExport('otherVariant=true&category=rebuild&page=3');
		const args = prismaMock.scrapRecord.findMany.mock.calls[0][0];
		expect(args).toEqual({
			where: {
				AND: [
					{ replacementPartMaterial: { not: null } },
					{ NOT: { replacementPartMaterial: '' } },
					{ NOT: { dmc: { startsWith: 'QNT-SCRAP-' } } },
					{ isRebuild: true }
				]
			},
			include: { partGroup: true },
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
		});
		expect(prismaMock.scrapRecord.count).toHaveBeenCalledWith({ where: args.where });
	});

	it('an empty result produces a file with the header only', async () => {
		prismaMock.scrapRecord.count.mockResolvedValue(0);
		prismaMock.scrapRecord.findMany.mockResolvedValue([]);
		const rows = await readRows(await runExport());
		expect(rows).toEqual([header]);
	});

	it('logs the export to activity logs', async () => {
		await runExport();
		expect(prismaMock.activityLogs.create).toHaveBeenCalledWith({
			data: { userId: 'u1', action: 'EXPORT', entityType: 'ScrapRecord', entityId: undefined }
		});
	});

	it('a failing activity log does not block the export', async () => {
		prismaMock.activityLogs.create.mockRejectedValue(new Error('log down'));
		const response = await runExport();
		expect(response.status).toBe(200);
	});

	it('a failing session lookup while logging does not block the export', async () => {
		authState.fail = true;
		const response = await runExport();
		expect(response.status).toBe(200);
	});

	it('rejects more than 50 000 rows with 400 without loading them', async () => {
		prismaMock.scrapRecord.count.mockResolvedValue(50_001);
		await expect(runExport()).rejects.toMatchObject({ status: 400 });
		expect(prismaMock.scrapRecord.findMany).not.toHaveBeenCalled();
	});

	it('rejects invalid filters with 400', async () => {
		await expect(runExport('otherVariant=maybe')).rejects.toMatchObject({ status: 400 });
	});

	it('returns 500 when the database fails', async () => {
		prismaMock.scrapRecord.findMany.mockRejectedValue(new Error('db down'));
		await expect(runExport()).rejects.toMatchObject({ status: 500 });
	});
});
