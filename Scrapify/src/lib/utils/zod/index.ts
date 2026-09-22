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
	groupName: z.string().trim().min(3).max(64),
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
		.pipe(z.array(z.coerce.number().int().positive()).min(1, 'Please select at least 1 part'))
});
export type PartGroupInput = z.infer<typeof partGroupSchema>;
