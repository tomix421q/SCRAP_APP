import z from 'zod';
import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';

export const scrapRecordSchema = z.object({
	scrapRecordId: z.string().optional(),
	partId: z.coerce.number().int().positive('Vyber prosim diel.'),
	scrapId: z.coerce.number().int().positive('Vyber prosim scrap code.'),
	description: z.string().min(1, 'Opis musi obsahovat aspon 1 znak.'),
	quantity: z.coerce
		.number('Zadaj iba cisla.')
		.positive('Množstvo musí byť kladné číslo.')
		.max(1000, 'Maximum je 1000 ks/kg.'),
	operatorId: z.string().min(5, 'Nutne id cislo karty zamestnanca').max(10, 'Max is 10.')
});

export const partGroupScrapCodeSchema = z.object({
	code: z.string().trim().min(1),
	isOtherComponent: z.boolean().default(false)
});
export type PartGroupScrapCodeInput = z.infer<typeof partGroupScrapCodeSchema>;

export const partGroupSchema = z
	.object({
		id: z.preprocess(
			(val) => (val === '' || val === null || val === undefined ? undefined : val),
			z.coerce.number().int().positive().optional()
		),
		groupName: z.string().trim().min(3).max(32),
		vProject: z.string().trim().min(2).max(50),
		interfaceName: z.string().trim().min(3).max(32),
		qadIdentity: z.string().trim().optional(),
		isRebuild: z.preprocess((val) => {
			if (typeof val === 'string') {
				return val.toLocaleLowerCase() === 'true' || val === 'on' || val === '1';
			}
			return Boolean(val);
		}, z.boolean()),
		cannotBeMainReason: z.preprocess((val) => {
			if (typeof val === 'string') {
				return val.toLocaleLowerCase() === 'true' || val === 'on' || val === '1';
			}
			return Boolean(val);
		}, z.boolean()),
		hiddenInScrap: z.preprocess((val) => {
			if (typeof val === 'string') {
				return val.toLocaleLowerCase() === 'true' || val === 'on' || val === '1';
			}
			return Boolean(val);
		}, z.boolean()),
		partNumbers: z
			.string()
			.transform((val, ctx) => {
				try {
					return JSON.parse(val);
				} catch {
					ctx.addIssue({ code: 'custom', message: 'Bad format for parts select' });
					return z.NEVER;
				}
			})
			.pipe(z.array(z.string())),
		scrapCodes: z
			.string()
			.transform((val, ctx) => {
				try {
					return JSON.parse(val);
				} catch {
					ctx.addIssue({ code: 'custom', message: 'Bad format for scrap codes select' });
					return z.NEVER;
				}
			})
			.pipe(z.array(partGroupScrapCodeSchema))
	})
	.superRefine((data, ctx) => {
		// Object refinements still run when a field failed without aborting, so guard the shape.
		if (!Array.isArray(data.scrapCodes)) return;
		const flaggedCount = data.scrapCodes.filter((sc) => sc.isOtherComponent).length;
		if (flaggedCount > 1) {
			ctx.addIssue({
				code: 'custom',
				path: ['scrapCodes'],
				message: 'Only one scrap code can be marked as Other component scrap code.'
			});
		}
		if (data.isRebuild && !data.cannotBeMainReason && flaggedCount === 0) {
			ctx.addIssue({
				code: 'custom',
				path: ['scrapCodes'],
				message: 'A rebuild group must have one scrap code marked as Other component scrap code.'
			});
		}
	})
	// Only a rebuild group can be flagged; the flag is always false otherwise.
	.transform((data) => ({ ...data, cannotBeMainReason: data.isRebuild && data.cannotBeMainReason }));
export type PartGroupInput = z.infer<typeof partGroupSchema>;

export const labelGroupsSchema = z.object({
	id: z.preprocess(
		(val) => (val === '' || val === null || val === undefined ? undefined : val),
		z.coerce.number().int().positive().optional()
	),
	vProject: z.string().trim().min(2).max(20),
	labelNumber: z.string().max(64).min(3),
	groups: z
		.string()
		.transform((val, ctx) => {
			try {
				return JSON.parse(val);
			} catch {
				ctx.addIssue({ code: 'custom', message: 'Bad format for groups select' });
				return z.NEVER;
			}
		})
		.pipe(z.array(z.coerce.number().int().positive()))
});
export type LabelGroupInput = z.infer<typeof labelGroupsSchema>;

export const scrapRowSchema = z.object({
	label: z.string().default(''),
	groupId: z.coerce.number().int().positive(),
	groupName: z.string().min(1),
	qadIdentifySymbol: z.string().default(''),
	isRebuildGroup: z.boolean().default(false),
	selectedScrapCode: z.string().default('').nullable(),
	selectedScrapDescription: z.string().default('').nullable(),
	isOtherVariant: z.boolean().default(false),
	replacementPartMaterial: z.string().optional().nullable(),
	isOtherComponent: z.boolean().default(false),
	// Part group whose Other component scrap code this row gets; only used with `isOtherComponent`.
	otherComponentCauseGroupId: z.number().int().positive().nullable().optional(),
	quantity: z.preprocess(
		(value) => (value === 0 || value === '0' ? 1 : value),
		z.coerce.number().int().positive().default(1).optional()
	)
});

export const saveScrapSchema = z
	.object({
		dmc: z.string().min(1, 'DMC kód je povinný'),
		isRebuild: z.preprocess((val) => {
			if (typeof val === 'string') {
				return val.toLocaleLowerCase() === 'true' || val === 'on' || val === '1';
			}
			return Boolean(val);
		}, z.boolean()),
		operator: z.string(),
		scrapPayload: z
			.string()
			.min(1, 'Data scrapu su povinne')
			.transform((str, ctx) => {
				try {
					const parsed = JSON.parse(str);
					if (!Array.isArray(parsed)) {
						ctx.addIssue({ code: 'custom', message: 'Data scrapu musia byt pole' });
						return z.NEVER;
					}
					return parsed;
				} catch {
					ctx.addIssue({ code: 'custom', message: 'Neplatny JSON format dat scrapu' });
					return z.NEVER;
				}
			})
			.pipe(z.array(scrapRowSchema))
			.refine((rows) => rows.some((r) => Boolean(r.selectedScrapCode) || r.isOtherVariant), {
				message: 'Musi byt vybrany aspon jeden dovod scrapu alebo iny variant'
			})
			.refine(
				(rows) =>
					!rows.some(
						(r) =>
							r.isOtherVariant &&
							(!r.replacementPartMaterial ||
								r.replacementPartMaterial.trim() === '' ||
								r.replacementPartMaterial === 'empty')
					),
				{ message: 'Pri volbe "Iny variant" musite vybrat konkretny variant PN' }
			)
	})
	.superRefine((data, ctx) => {
		// Zod still runs object refinements when a field failed without aborting
		// (e.g. an empty `scrapPayload` string), so the payload may not be an array here.
		if (!Array.isArray(data.scrapPayload)) return;
		const hasInvalidCause = data.scrapPayload.some((row) => {
			if (!row.isOtherComponent) return false;
			const cause = data.scrapPayload.find(
				(other) => other.groupId === row.otherComponentCauseGroupId
			);
			return (
				!cause ||
				cause.groupId === row.groupId ||
				cause.isOtherComponent ||
				cause.isOtherVariant ||
				!cause.selectedScrapCode
			);
		});
		if (hasInvalidCause) {
			ctx.addIssue({
				code: 'custom',
				path: ['scrapPayload'],
				message: 'Pri voľbe iný komponent musí byť zvolená príčina s vybraným dôvodom scrapu.'
			});
		}
	});
export const saveQuantityScrapSchema = z.object({
	dmc: z
		.string()
		.refine(
			(value) =>
				value.startsWith(quantityScrapLabelPrefix) &&
				value.length > quantityScrapLabelPrefix.length,
			'Vyber platný quantity scrap label.'
		),
	labelGroupId: z.coerce.number().int().positive(),
	operator: z.string().min(1, 'Operátor je povinný'),
	scrapPayload: z
		.string()
		.min(1, 'Data quantity scrapu su povinne')
		.transform((str, ctx) => {
			try {
				const parsed: unknown = JSON.parse(str);
				if (!Array.isArray(parsed)) {
					ctx.addIssue({ code: 'custom', message: 'Data quantity scrapu musia byt pole' });
					return z.NEVER;
				}
				return parsed;
			} catch {
				ctx.addIssue({ code: 'custom', message: 'Neplatny JSON format dat quantity scrapu' });
				return z.NEVER;
			}
		})
		.pipe(z.array(scrapRowSchema).min(1, 'Zadaj kladne mnozstvo aspon pre jednu skupinu.'))
		.refine((rows) => new Set(rows.map((row) => row.groupId)).size === rows.length, {
			message: 'Skupina dielov sa nesmie opakovat.'
		})
});
export type SaveScrapInput = z.infer<typeof saveScrapSchema>;

/** Upper bound of a SQL Server `Int` column (e.g. `Operator.cardId`). */
const SQL_INT_MAX = 2_147_483_647;

/** Shared by creating and editing an operator, so both accept the same values. */
export const createOperatorSchema = z.object({
	fullName: z
		.string()
		.trim()
		.min(5, 'Name must have at least 5 characters.')
		.max(255, 'Name can have at most 255 characters.'),
	cardId: z
		.string()
		.trim()
		.regex(/^\d+$/, 'Card ID may contain digits only.')
		.transform(Number)
		.pipe(
			z
				.number()
				.int()
				.positive('Card ID must be a positive number.')
				.max(SQL_INT_MAX, `Card ID can be at most ${SQL_INT_MAX}.`)
		)
});
export type CreateOperatorInput = z.infer<typeof createOperatorSchema>;

export const updateOperatorSchema = createOperatorSchema.extend({
	id: z.coerce.number().int().positive()
});
export type UpdateOperatorInput = z.infer<typeof updateOperatorSchema>;
