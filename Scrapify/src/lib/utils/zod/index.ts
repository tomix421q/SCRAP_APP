import z from 'zod';

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
	scrapCodesIds: z
		.string()
		.transform((val, ctx) => {
			try {
				return JSON.parse(val);
			} catch {
				ctx.addIssue({ code: 'custom', message: 'Bad format for scrap codes select' });
				return z.NEVER;
			}
		})
		.pipe(z.array(z.coerce.number().int().positive()))
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
	selectedScrapId: z.coerce.number().int().positive().optional().nullable(),
	selectedScrapCode: z.string().default(''),
	selectedScrapName: z.string().default(''),
	isOtherVariant: z.boolean().default(false),
	replacementPartMaterial: z.string().optional().nullable(),
	isOtherComponent: z.boolean().default(false)
});

export const saveScrapSchema = z.object({
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
		.refine((rows) => rows.some((r) => Boolean(r.selectedScrapId)), {
			message: 'Musi byt vyrany aspon jeden dovod scrapu'
		})
		.refine(
			(rows) =>
				!rows.some(
					(r) =>
						r.isOtherVariant &&
						(!r.replacementPartMaterial || r.replacementPartMaterial.trim() === '')
				),
			{ message: 'Pri volbe "Iny variant" musite vybrat konrektny variant PN' }
		)
});
export type SaveScrapInput = z.infer<typeof saveScrapSchema>;
