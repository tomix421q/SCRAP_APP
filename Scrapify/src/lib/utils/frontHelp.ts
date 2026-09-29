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

export function playBeep(type: 'ok' | 'error') {
	try {
		const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.connect(gain);
		gain.connect(ctx.destination);

		if (type === 'ok') {
			osc.frequency.setValueAtTime(1200, ctx.currentTime);
			gain.gain.setValueAtTime(0.15, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
			osc.start();
			osc.stop(ctx.currentTime + 0.12);
		} else {
			osc.frequency.setValueAtTime(250, ctx.currentTime);
			gain.gain.setValueAtTime(2.25, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
			osc.start();
			osc.stop(ctx.currentTime + 0.35);
		}
	} catch {
		// Ignorovať, ak prehliadač blokuje audio pred prvou interakciou
	}
}
