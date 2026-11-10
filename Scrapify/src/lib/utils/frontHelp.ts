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

/**
 * Scales an image down so its longer side is at most `maxSize` px and re-encodes it as JPEG.
 * Re-encoding through a canvas also drops EXIF metadata. JPEG is encodable in every browser
 * (webp is not, e.g. mobile Safari). Browser only.
 */
export async function resizeImageToJpeg(file: File, maxSize = 800, quality = 0.85): Promise<File> {
	const bitmap = await createImageBitmap(file);
	try {
		const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(bitmap.width * scale));
		canvas.height = Math.max(1, Math.round(bitmap.height * scale));
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Canvas is not available in this browser.');
		// JPEG has no alpha channel: paint a white background so transparent PNGs do not turn black.
		context.fillStyle = '#fff';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', quality)
		);
		if (!blob || blob.type !== 'image/jpeg') {
			throw new Error('This browser cannot encode jpeg images.');
		}
		return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
	} finally {
		bitmap.close();
	}
}
