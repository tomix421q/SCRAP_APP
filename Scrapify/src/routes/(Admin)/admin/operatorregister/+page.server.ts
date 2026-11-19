import { fail, error, type Actions, type ActionFailure } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import prismaClient from '@/server/prisma';
import { requireRole, writeToLogger } from '@/utils/serverHelp';
import { OPERATOR_MANAGE_ROLES } from '@/utils/adminAccess';
import { describeError, errorCode } from '@/utils/describeError';
import { createOperatorSchema, updateOperatorSchema } from '@/utils/zod';
import type { ZodError } from 'zod';

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
	} catch (err: unknown) {
		throw error(500, { message: describeError(err) });
	}
}) satisfies PageServerLoad;

const validationFailure = (error: ZodError) =>
	fail(400, {
		success: false,
		message: 'Validation error',
		error: error.flatten((issue) => issue.message).fieldErrors
	});

const duplicateCardId = (cardId: number) =>
	fail(409, {
		success: false,
		message: `Card ID ${cardId} is already used by another operator.`
	});

const unexpectedFailure = (err: unknown) =>
	fail(500, {
		success: false,
		message: 'Something is wrong, Please try again later.',
		error: describeError(err)
	});

export const actions: Actions = {
	createOperator: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const access = await requireRole(event, OPERATOR_MANAGE_ROLES);
		if (!access.ok) return access.failure;

		const formData = await event.request.formData();
		const parsed = createOperatorSchema.safeParse(Object.fromEntries(formData));
		if (!parsed.success) return validationFailure(parsed.error);
		const { fullName, cardId } = parsed.data;

		try {
			const created = await prismaClient.operator.create({
				data: { cardId, fullName, createdBy: access.user.email }
			});
			await writeToLogger({
				request: event.request,
				action: 'CREATE',
				entityType: 'Operator',
				entityId: created.id
			});
			return {
				success: true,
				message: `Operator named: ${created.fullName} with card id ${created.cardId} was created successfully.`
			};
		} catch (err: unknown) {
			if (errorCode(err) === 'P2002') return duplicateCardId(cardId);
			return unexpectedFailure(err);
		}
	},
	updateOperator: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const access = await requireRole(event, OPERATOR_MANAGE_ROLES);
		if (!access.ok) return access.failure;

		const formData = await event.request.formData();
		const parsed = updateOperatorSchema.safeParse(Object.fromEntries(formData));
		if (!parsed.success) return validationFailure(parsed.error);
		const { id, fullName, cardId } = parsed.data;

		try {
			const updated = await prismaClient.operator.update({
				where: { id },
				data: { fullName, cardId }
			});
			await writeToLogger({
				request: event.request,
				action: 'EDIT',
				entityType: 'Operator',
				entityId: updated.id
			});
			return {
				success: true,
				message: `Operator ${updated.fullName} with card id ${updated.cardId} was updated.`
			};
		} catch (err: unknown) {
			const code = errorCode(err);
			if (code === 'P2002') return duplicateCardId(cardId);
			// `update` throws P2025 when no operator has this id.
			if (code === 'P2025') {
				return fail(404, {
					success: false,
					message: 'Operator not found',
					error: `Operator id ${id} not found in db.`
				});
			}
			return unexpectedFailure(err);
		}
	},
	deleteOperator: async (event): Promise<ResultInfoData | ActionFailure<ResultInfoData>> => {
		const access = await requireRole(event, OPERATOR_MANAGE_ROLES);
		if (!access.ok) return access.failure;

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
				await writeToLogger({
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
		} catch (err: unknown) {
			return {
				success: false,
				message: 'Something is wrong, Please try again later.',
				error: describeError(err)
			};
		}
	}
};
