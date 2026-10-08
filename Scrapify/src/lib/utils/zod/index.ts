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
	id: z.coerce.number().int().positive().optional(),
	processId: z.coerce.number().int().positive('Please select process'),
	projectId: z.coerce.number().int().positive('Please select project'),
	groupName: z.string().trim().min(3).max(64),
	isRebuild: z.preprocess((val) => {
		if (typeof val === 'string') {
			return val.toLocaleLowerCase() === 'true' || val === 'on' || val === '1';
		}
		return Boolean(val);
	}, z.boolean()),
	partIds: z
		.string()
		.transform((val, ctx) => {
			try {
				return JSON.parse(val);
			} catch {
				ctx.addIssue({ code: 'custom', message: 'Bad format for parts select' });
				return z.NEVER;
			}
		})
		.pipe(z.array(z.coerce.number().int().positive())),
	scrapCodesIds: z
		.string()
		.transform((val, ctx) => {
			try {
				return JSON.parse(val);
			} catch (error) {
				ctx.addIssue({ code: 'custom', message: 'Bad format for scrap codes select' });
				return z.NEVER;
			}
		})
		.pipe(z.array(z.coerce.number().int().positive()))
});
export type PartGroupInput = z.infer<typeof partGroupSchema>;

export const labelGroupsSchema = z.object({
	id: z.coerce.number().int().positive().optional(),
	processId: z.coerce.number().int().positive('Please select process'),
	projectId: z.coerce.number().int().positive('Please select project'),
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

export const saveScrapSchema = z.object({
	dmc: z.string().min(1, 'DMC kód je povinný'),
	isRebuild: z.preprocess((val) => {
		if (typeof val === 'string') {
			return val.toLocaleLowerCase() === 'true' || val === 'on' || val === '1';
		}
		return Boolean(val);
	}, z.boolean()),
	otherVariant: z
		.string()
		.optional()
		.transform((str, ctx) => {
			if (str) {
				try {
					const parsed = JSON.parse(str);
					if (typeof parsed !== 'object' || parsed === null) {
						throw new Error();
					}
					return parsed as Record<string, string>;
				} catch {
					ctx.addIssue({ code: 'custom', message: 'Neplatny format part ids' });
				}
				return z.NEVER;
			}
		}),
	scrapCodes: z
		.string()
		.min(1, 'Chýbajú scrap kódy')
		.transform((str, ctx) => {
			try {
				const parsed = JSON.parse(str);
				if (typeof parsed !== 'object' || parsed === null) {
					throw new Error();
				}
				return parsed as Record<string, string>;
			} catch {
				ctx.addIssue({
					code: 'custom',
					message: 'Neplatný formát scrap kódov'
				});
				return z.NEVER;
			}
		})
		.refine((codes) => Object.values(codes).some((val) => val.trim().length > 0), {
			message: 'Musí byť vybraný aspoň jeden scrap kód'
		})
});
