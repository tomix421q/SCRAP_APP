import z from 'zod';

export const scrapRecordSchema = z.object({
	partId: z.coerce.number().int().positive('Vyber prosim diel.'),
	scrapId: z.coerce.number().int().positive('Vyber prosim scrap code.'),
	description: z.string().optional(),
	quantity: z.coerce
		.number('Zadaj iba cisla.')
		.int()
		.positive('Množstvo musí byť celé kladné číslo.')
		.max(100,'Maximum je 100 kusov.'),
	operatorId: z.string().min(5, 'Nutne id cislo karty zamestnanca').max(10, 'Max is 10.')
});
