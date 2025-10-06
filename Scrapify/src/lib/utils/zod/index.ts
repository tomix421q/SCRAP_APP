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
