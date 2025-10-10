import { fail, error, type Actions, type ActionFailure } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import prismaClient from '@/server/prisma';
import { writeToLogger } from '@/utils/serverHelp';

export const load = (async (event) => {
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const limit = 50;
	const skip = (page - 1) * limit;

	try {
		const allOperatorsPromise = (async () => {
			// await sleep(5000);
			return prismaClient.operator.findMany({
				skip: skip,
				take: limit,
				orderBy: {
					createdAt: 'desc' // Odporúčam zoradenie pre stránkovanie
				}
			});
		})();

		return { allOperatorsPromise, currentPage: page };
	} catch (err: any) {
		throw error(500, { message: `${err}` });
	}
}) satisfies PageServerLoad;

export const actions: Actions = {
	createOperator: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const opName = formData.get('fullName') as string;
		const cardId = formData.get('cardId') as string;
		const createdBy = formData.get('createdBy') as string;

		if (cardId.length < 5 || opName.length < 5) {
			return fail(400, {
				success: false,
				message: 'Validate errro',
				error: 'Min length for operator id and name is 5 characters.'
			});
		}
		if (cardId.length > 255 || opName.length > 255) {
			return fail(400, {
				success: false,
				message: 'Validate errro',
				error: 'Max length for operator id and name is 255 characters.'
			});
		}

		try {
			const createOperatorInDb = await prismaClient.operator.create({
				data: {
					cardId: Number(cardId),
					fullName: opName,
					createdBy: createdBy
				}
			});
			writeToLogger({
				request: event.request,
				action: 'CREATE',
				entityType: 'Operator',
				entityId: createOperatorInDb.id
			});
			return {
				success: true,
				message: `Operator named: ${createOperatorInDb.fullName} with card id ${createOperatorInDb.cardId} was created successfully.`
			};
		} catch (error: any) {
			return {
				success: false,
				message: `Something is wrong :( Please try again later.`,
				error: error.message + ' ' + error.code || 'Unknown error'
			};
		}
	},
	deleteOperator: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const formData = await event.request.formData();
		const { deleteId } = Object.fromEntries(formData);

		if (!deleteId) {
			return fail(400, { success: false, message: 'Validation', error: 'Id not found.' });
		}
		try {
			const findOperator = await prismaClient.operator.findFirst({
				where: { id: Number(deleteId) }
			});
			if (!findOperator) {
				return fail(404, {
					success: false,
					message: 'Validation',
					error: `Operator id ${deleteId} not found in db.`
				});
			} else {
				const deleteOp = await prismaClient.operator.delete({ where: { id: findOperator.id } });
				writeToLogger({
					request: event.request,
					action: 'DELETE',
					entityType: 'Operator',
					entityId: deleteOp.id
				});
				return {
					success: true,
					message: `Successful deleted id: ${findOperator.id} with name ${findOperator.fullName} and cardId ${findOperator.cardId}.`
				};
			}
		} catch (error: any) {
			return {
				success: false,
				message: 'Something is wrong, Please try again later.',
				error: error.message + ' ' + error.code || 'Unknown error'
			};
		}
	}
};
