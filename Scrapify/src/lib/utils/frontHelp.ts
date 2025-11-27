import { createScrapNotesStore } from '@/stores/stores';
import type { createScrapNoteType } from './types'; // Nezabudni importovať aj ScrapCodeItem

export function handleClickMinus(partNumber: string, sc: string) {
	createScrapNotesStore.update((currentNotes: createScrapNoteType[]) => {
		let updatedNotes = [...currentNotes];

		const existingNoteIndex = updatedNotes.findIndex((note) => note.partNumber === partNumber);

		if (existingNoteIndex !== -1) {
			let existingNote = updatedNotes[existingNoteIndex];

			const existingScrapCodeIndex = existingNote.scrapCode.findIndex((scrap) => scrap.sc === sc);

			if (existingScrapCodeIndex !== -1) {
				let existingScrapCode = existingNote.scrapCode[existingScrapCodeIndex];
				existingScrapCode.qnt--;
				existingNote.quantity--;

				if (existingScrapCode.qnt <= 0) {
					existingNote.scrapCode = existingNote.scrapCode.filter((item: any) => item.sc !== sc);
				}
				if (existingNote.quantity <= 0) {
					updatedNotes = updatedNotes.filter(
						(n: createScrapNoteType) => n.partNumber !== partNumber
					);
				}
				if (existingNote.quantity > 0 && existingNote.scrapCode.length === 0) {
					updatedNotes = updatedNotes.filter(
						(n: createScrapNoteType) => n.partNumber !== partNumber
					);
				}
			}
		}

		const dataToStore =
			updatedNotes.length > 0
				? JSON.stringify(
						updatedNotes.map(
							(note: createScrapNoteType) =>
								`${note.partNumber}=${note.quantity}=${note.scrapCode
									.map((sCode) => `${sCode.sc}-${sCode.qnt}`)
									.join(',')}`
						)
					)
				: '[]';
		localStorage.setItem('partNote_', dataToStore);

		return updatedNotes;
	});
}
