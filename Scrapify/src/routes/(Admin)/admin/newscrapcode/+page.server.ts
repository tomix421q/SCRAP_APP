import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prismaClient from '@/server/prisma';
import { toFuzzyPattern } from '@/utils/serverHelp';
import type { Prisma } from '@prisma/client';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 100;
	const skip = (page - 1) * limit;

	const filters = {
		scrapCode: event.url.searchParams.get('scrapCode'),
		vProjectName: event.url.searchParams.get('vProject'),
		description: event.url.searchParams.get('description') as string,
		vProcess: event.url.searchParams.get('vProcess') as string
	};
	// console.log(filters);
	const where: Prisma.vScrapCodesWhereInput = {};
	if (filters.scrapCode) {
		where.Reason_Code = { contains: toFuzzyPattern(filters.scrapCode) };
	}
	if (filters.vProjectName) {
		where.Reason_Project = { contains: toFuzzyPattern(filters.vProjectName) };
	}

	if (filters.description) {
		where.Reason_Description = { contains: toFuzzyPattern(filters.description) };
	}
	if (filters.vProcess) {
		where.Reason_Process_EN = { contains: toFuzzyPattern(filters.vProcess) };
	}

	try {
		const findScCodes = await prismaClient.vScrapCodes.findMany({
			where,
			skip,
			take: limit,
			orderBy: { Reason_Code: 'asc' }
		});
		const scrapCodeCount = await prismaClient.vScrapCodes.count({ where });
		const totalPages = Math.ceil(scrapCodeCount / limit);
		const data = {
			scrapCodes: findScCodes,
			scrapCodeCount,
			totalPages
		};
		return { data };
	} catch (err) {
		throw error(500, { message: `${err}` });
	}
};
