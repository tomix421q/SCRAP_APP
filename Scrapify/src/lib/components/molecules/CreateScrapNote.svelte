<script lang="ts">
	import { Minus, Plus, Trash, X } from '@lucide/svelte';
	import type { Part } from '@prisma/client';
	import Button from '../ui/button/button.svelte';
	import Input from '../ui/input/input.svelte';

	let { parts, filterOptions }: { parts: Part[]; filterOptions: { processId: string } } = $props();

	let partNotes: { partNumber: string; quantity: number }[] = $state([]);
	let findPartNumber: string = $state('');
	let filteredParts = $derived.by(() => {
		if (findPartNumber.trim() === '') {
			return [];
		}
		return parts.filter((part) =>
			part.partNumber.toLowerCase().includes(findPartNumber.toLowerCase())
		);
	});

	function handleClickPlus(partNumber: string) {
		const existingNote = partNotes.find((note) => note.partNumber === partNumber);
		if (existingNote) {
			existingNote.quantity += 1;
		} else {
			partNotes.push({ partNumber, quantity: 1 });
		}
		localStorage.setItem(
			'partNote_',
			JSON.stringify(partNotes.map((note) => `${note.partNumber}=${note.quantity}`))
		);
	}

	function handleClickMinus(partNumber: string) {
		const existingNoteIndex = partNotes.findIndex((note) => note.partNumber === partNumber);

		if (existingNoteIndex !== -1 && partNotes[existingNoteIndex].quantity > 0) {
			partNotes[existingNoteIndex].quantity -= 1;
			if (partNotes[existingNoteIndex].quantity === 0) {
				partNotes.splice(existingNoteIndex, 1);
			}
			localStorage.setItem(
				'partNote_',
				JSON.stringify(partNotes.map((note) => `${note.partNumber}=${note.quantity}`))
			);
		}
	}

	$effect(() => {
		let getLC = localStorage.getItem('partNote_');
		if (getLC) {
			let parse = JSON.parse(getLC);
			partNotes = parse.map((item: string) => {
				const [partNumber, quantity] = item.split('=');
				return { partNumber, quantity: parseInt(quantity) };
			});
		}
	});

	// $inspect(filteredParts);
</script>

<main
	class="formNormalize p-4 lg:min-w-xl {parts.length > 0 && filterOptions.processId
		? 'flex'
		: 'hidden'}"
>
	<section class="text-center pb-4">
		<h2 class="text-primary text-2xl font-bold mx-auto">
			Poznamky <Button
				onclick={() => (partNotes = [])}
				size="sm"
				variant="ghost"
				class="size-6 text-destructive {partNotes.length === 0 ? 'invisible' : 'visible'}"
				title="Vymazat poznamky"><Trash /></Button
			>
		</h2>

		<span class="text-xs text-muted-foreground"
			>Sluzia len na priebezny zapis,na zapis do Quadu je nutne vytvorit scrap.</span
		>
		<!-- Filter -->
		<article class="flex items-center justify-between gap-4 mt-6">
			<div class="relative mx-auto">
				<Input bind:value={findPartNumber} placeholder="Vyhladaj part" class="inputNormalize" />
				<Button
					onclick={() => (findPartNumber = '')}
					size="icon"
					variant="ghost"
					class=" absolute right-1 top-1 text-destructive size-6 {findPartNumber
						? 'visible'
						: 'invisible'}"><X /></Button
				>
			</div>
		</article>
	</section>

	<!--  -->
	<section class="grid grid-cols-2 gap-x-10">
		{#each parts as part}
			<div class="flex items-center hover:bg-primary/20 px-1 rounded-md">
				<p
					class={`min-w-[200px] ease-in duration-200 transition-all rounded-sm px-1  ${
						filteredParts.some((fp) => fp.partNumber === part.partNumber) && 'bg-chart-success'
					}`}
				>
					{part.partNumber}
				</p>

				<article class="flex rounded-lg items-center">
					<!-- Number -->
					<p class="text-chart-1 font-bold text-md min-w-[40px] text-center">
						{#each partNotes as note}
							{#if note.partNumber === part.partNumber}
								<span>{note.quantity}</span>
							{/if}
						{/each}
					</p>

					<!-- BTNs -->
					<div class="min-w-[50px] flex gap-2">
						<p>
							<Button
								size={'icon'}
								variant="ghost"
								class="size-6 {partNotes.find(
									(note) => note.partNumber === part.partNumber && note.quantity > 0
								)
									? ' text-destructive'
									: 'text-muted'}"
								onclick={() => handleClickMinus(part.partNumber)}
							>
								<Minus />
							</Button>
						</p>

						<p>
							<Button
								size={'icon'}
								variant="ghost"
								class="size-6 text-chart-1"
								onclick={() => handleClickPlus(part.partNumber)}><Plus /></Button
							>
						</p>
					</div>
				</article>
			</div>
		{/each}
	</section>
</main>
