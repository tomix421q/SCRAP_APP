import type { Prisma } from '@prisma/client';
import type { RequestHandler } from './$types';
import prismaClient from '@/server/prisma';
import { writeToLogger } from '@/utils/serverHelp';

export const GET: RequestHandler = async (event) => {
	const filters = {
		partNumber: event.url.searchParams.get('partNumber'),
		partId: Number(event.url.searchParams.get('partId')),
		scrapCode: event.url.searchParams.get('scrapCode'),
		processName: Number(event.url.searchParams.get('processName')),
		dateFrom: event.url.searchParams.get('dateFrom'),
		dateTo: event.url.searchParams.get('dateTo')
	};

	const where: Prisma.ScrapRecordWhereInput = {};
	const partWhere: Prisma.PartWhereInput = {};
	if (filters.partNumber) {
		if (!where.part) where.part = {};
		partWhere.partNumber = { contains: filters.partNumber };
	}
	if (filters.partId) {
		partWhere.id = filters.partId;
	}

	if (filters.processName) {
		partWhere.process = { id: { equals: filters.processName } };
	}
	if (Object.keys(partWhere).length > 0) {
		where.part = partWhere;
	}
	if (filters.scrapCode) {
		where.scrapCode = { code: { contains: filters.scrapCode } };
	}
	// Date filter
	const createdAtFilter: Prisma.DateTimeFilter = {};
	if (filters.dateFrom) {
		createdAtFilter.gte = `${filters.dateFrom}T00:00:00.000Z`;
	}

	if (filters.dateTo) {
		createdAtFilter.lte = `${filters.dateTo}T23:59:59.999Z`;
	}
	if (Object.keys(createdAtFilter).length > 0) {
		where.createdAt = createdAtFilter;
	}

	const records = await prismaClient.scrapRecord.findMany({
		where,
		include: { part: true, scrapCode: true },
		orderBy: { createdAt: 'desc' }
	});

	// 4. Prekonvertuj dáta na CSV string (rovnaká logika ako na frontende)
	const headers = [
		'ID',
		'Scrap Code',
		'Scrap name',
		'Part Id',
		'Part Number',
		'Side',
		'Process Name',
		'Quantity',
		'Description',
		'Created By',
		'Created At'
	];
	const csvRows = [headers.join(',')];
	for (const record of records) {
		const values = [
			record.id,
			record.scrapCode.code,
			record.scrapCode.name,
			record.part.id,
			record.part.partNumber,
			record.part.side,
			record.part.processName,
			record.quantity,
			record.description,
			record.createdBy,
			new Date(record.createdAt).toISOString()
		];
		const escapedValues = values.map((val) => `"${String(val).replace(/"/g, '""')}"`);
		csvRows.push(escapedValues.join(','));
	}
	const csvString = csvRows.join('\n');

	if (records) {
		writeToLogger({
			request: event.request,
			action: 'EXPORT',
			entityType: 'ScrapRecord'
		});
	}
	// 5. Vráť CSV ako súbor na stiahnutie
	return new Response(csvString, {
		status: 200,
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="scrap_report_${new Date().toISOString().split('T')[0]}.csv"`
		}
	});
};
