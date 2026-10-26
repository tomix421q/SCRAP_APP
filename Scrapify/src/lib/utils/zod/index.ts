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

export const partGroupSchema = z.object({
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
		.pipe(z.array(z.string()))
});
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
	isOtherComponent: z.boolean().default(false)
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
		if (
			!data.isRebuild &&
			data.scrapPayload.some(
				(row) =>
					row.isOtherComponent &&
					!data.scrapPayload.some(
						(other) =>
							other.groupId !== row.groupId &&
							(Boolean(other.selectedScrapCode) || other.isOtherVariant)
					)
			)
		) {
			ctx.addIssue({
				code: 'custom',
				path: ['scrapPayload'],
				message: 'Pri voľbe iný komponent musí mať iná skupina vybraný dôvod scrapu.'
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
		.pipe(
			z
				.array(
					z.object({
						groupId: z.coerce.number().int().positive(),
						quantity: z.coerce.number().int().positive()
					})
				)
				.min(1, 'Zadaj kladne mnozstvo aspon pre jednu skupinu.')
		)
		.refine((rows) => new Set(rows.map((row) => row.groupId)).size === rows.length, {
			message: 'Skupina dielov sa nesmie opakovat.'
		})
});
export type SaveScrapInput = z.infer<typeof saveScrapSchema>;
