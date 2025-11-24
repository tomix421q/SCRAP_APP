<script lang="ts">
	import { Minus, Plus, Trash, X } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';
	import Input from '../ui/input/input.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import Combobox from '../atoms/Combobox.svelte';
	import Separator from '../ui/separator/separator.svelte';
	import Label from '../ui/label/label.svelte';
	import type { Part, Project, ScrapCode } from '../../../../prisma/generated/client/client';
	import { browser } from '$app/environment';

	let {
		parts,
		projectsForFilteredProcess,
		filterOptions,
		scrapCodes
	}: {
		parts: Part[];
		projectsForFilteredProcess: Project[];
		filterOptions: { processId: string };
		scrapCodes: ScrapCode[];
	} = $props();

	interface partNoteType {
		partNumber: string;
		quantity: number;
		scrapCode: {
			sc: string;
			qnt: number;
		}[];
	}

	let partNotes: partNoteType[] = $state([]);
	let findPartNumber: string = $state('');
	let findPartNumberByProject: number | undefined = $state();
	let selectedScrapCodeId = $state<string>('');
	let findScrapCode = $derived.by(() => {
		let findScrap = scrapCodes.find((item) => item.id === Number(selectedScrapCodeId));
		return { SC: findScrap?.name };
	});
	let resetSelectedScrapCode = $state<boolean>(false);
	let filteredParts = $derived.by(() => {
		let filterPartsComplete: Part[] | undefined;
		if (findPartNumber.trim() === '' && findPartNumberByProject === undefined) {
			return [];
		}
		if (findPartNumberByProject) {
			filterPartsComplete = parts.filter((part) => part.projectId === findPartNumberByProject);
		}
		if (findPartNumber) {
			filterPartsComplete = parts.filter((part) =>
				part.partNumber.toLowerCase().includes(findPartNumber.toLowerCase())
			);
		}
		return filterPartsComplete;
	});

	function handleClickPlus(partNumber: string, selectedScrapCode: string) {
		let existingNote = partNotes.find((note) => note.partNumber === partNumber);
		// exist note for this PN ?
		if (existingNote) {
			existingNote.quantity++;
			let existingScrapCode = existingNote.scrapCode.find((item) => item.sc === selectedScrapCode);
			// exist in PN scrapcode ?
			if (existingScrapCode) {
				existingScrapCode.qnt++;
			} else {
				existingNote.scrapCode.push({ sc: selectedScrapCode, qnt: 1 });
			}
		} else {
			partNotes.push({ partNumber, quantity: 1, scrapCode: [{ sc: selectedScrapCode, qnt: 1 }] });
		}
		resetSelectedScrapCode = true;
		localStorage.setItem(
			'partNote_',
			JSON.stringify(
				partNotes.map(
					(note) =>
						`${note.partNumber}=${note.quantity}=${note.scrapCode.map((sc) => `${sc.sc}-${sc.qnt}`)}`
				)
			)
		);
	}

	function handleClickMinus(partNumber: string, sc: string) {
		let existingNote = partNotes.find((note) => note.partNumber === partNumber);

		if (existingNote) {
			const existingScrapCode = existingNote?.scrapCode.find((scrap) => scrap.sc === sc);
			if (existingScrapCode) {
				existingScrapCode.qnt--;
				existingNote.quantity--;
				// Remove the scrap code entry if its quantity dropped to 0
				if (existingScrapCode.qnt <= 0) {
					existingNote.scrapCode = existingNote.scrapCode.filter((item) => item.sc !== sc);
				}
				// Remove the entire note if total quantity is 0
				if (existingNote.quantity <= 0) {
					partNotes = partNotes.filter((n) => n.partNumber !== partNumber);
				}
				localStorage.setItem(
					'partNote_',
					JSON.stringify(
						partNotes.map(
							(note) =>
								`${note.partNumber}=${note.quantity}=${note.scrapCode.map((sc) => `${sc.sc}-${sc.qnt}`)}`
						)
					)
				);
			}
		}
	}

	function deleteAllNotes() {
		partNotes = [];
		localStorage.removeItem('partNote_');
	}

	$effect(() => {
		if (!browser) return;

		let getLC = localStorage.getItem('partNote_');
		if (getLC) {
			try {
				let parse = JSON.parse(getLC);

				if (Array.isArray(parse)) {
					partNotes = parse
						.map((item: string) => {
							if (typeof item !== 'string' || item.split('=').length !== 3) {
								console.warn("Skipping invalid item in localStorage 'partNote_':", item);
								return null;
							}

							const [partNumber, quantity, scrapCodesRaw] = item.split('=');
							let parsedScrapCodes: { sc: string; qnt: number }[] = [];

							if (typeof scrapCodesRaw === 'string') {
								const scrapCodeSplit = scrapCodesRaw.split(',');
								parsedScrapCodes = scrapCodeSplit.map((codeItem) => {
									if (typeof codeItem !== 'string' || !codeItem.includes('-')) {
										console.warn('Skipping invalid scrapCode item:', codeItem);
										return { sc: 'UNKNOWN', qnt: 0 };
									}
									const splitNameQnt = codeItem.trim().split('-');
									return { sc: splitNameQnt[0], qnt: Number(splitNameQnt[1]) };
								});
							}

							return { partNumber, quantity: parseInt(quantity), scrapCode: parsedScrapCodes };
						})
						.filter((item) => item !== null);
				} else {
					console.warn("Parsed data from 'partNote_' is not an array, clearing localStorage.");
					localStorage.removeItem('partNote_');
					partNotes = [];
				}
			} catch (e) {
				console.error("Error parsing 'partNote_' from localStorage, clearing it:", e);
				localStorage.removeItem('partNote_');
				partNotes = [];
			}
		}
	});

	// $inspect(partNotes);
</script>

<main
	class="formNormalize w-full {parts.length > 0 && filterOptions.processId ? 'flex' : 'hidden'}"
>
	<section class="text-center">
		<h2 class="text-primary text-2xl font-bold mx-auto">Poznamky</h2>

		<span class="text-xs text-muted-foreground"
			>Sluzia len na priebezny zapis ktory nikto nevidi,na zapis do Quadu je nutne vytvorit scrap.</span
		>
		<!-- Filter -->
		<article class="flex items-center justify-between gap-4 mt-6">
			<div class="relative">
				<Input
					bind:value={findPartNumber}
					placeholder="Vyhladaj part"
					class="inputNormalize text-3xl!"
				/>
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

	<!-- Delete btn -->
	<section class="flex items-center justify-between gap-2">
		<div class="flex items-center gap-2">
			{#each projectsForFilteredProcess as project}
				<Button
					size="sm"
					variant="secondary"
					class={findPartNumberByProject && findPartNumberByProject === project.id
						? 'text-chart-1'
						: ''}
					onclick={() => {
						findPartNumberByProject = project.id;
					}}
				>
					{project.name}
				</Button>
			{/each}

			<Button
				size="icon"
				variant="ghost"
				class={findPartNumberByProject ? 'flex size-6 text-destructive' : 'hidden'}
				onclick={() => {
					findPartNumberByProject = undefined;
				}}><X /></Button
			>
		</div>
		<Button
			onclick={() => deleteAllNotes()}
			size="sm"
			variant="destructive"
			class="bg-destructive/60 {partNotes.length === 0 ? 'hidden' : 'flex ml-auto'}"
			title="Vymazat poznamky"><Trash />Vymazat poznamky</Button
		>
	</section>

	<!-- parts list -->
	<section class="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-1.5">
		{#each parts as part}
			{@render addNoteInScrapRecord(part.partNumber)}
		{/each}
	</section>
</main>

{#snippet addNoteInScrapRecord(partNumber: string)}
	<Dialog.Root>
		<Dialog.Trigger
			class={`flex h-min gap-1 p-1 hover:bg-chart-1/30! border ease-in duration-100 transition-all text-sm rounded-lg items-center bg-chart-4 ${
				filteredParts?.some((fp) => fp.partNumber === partNumber) && 'bg-primary/80!'
			}`}
			><Plus size={16} class="text-chart-1" />
			<!-- part number -->
			<article class={`flex justify-between w-full`}>
				<p>
					{partNumber}
				</p>

				<!-- Number -->
				<p class="text-md text-warning font-bold mr-1">
					{#each partNotes as note}
						{#if note.partNumber === partNumber}
							{note.quantity}
						{/if}
					{/each}
				</p>
			</article>
		</Dialog.Trigger>

		<!-- dialog -->
		<Dialog.Content class="min-h-[500px] flex flex-col bg-transparent cardNormalize">
			<Dialog.Header class="mb-4">
				<Dialog.Title class="text-primary font-bold text-3xl text-center">{partNumber}</Dialog.Title
				>
			</Dialog.Header>

			<!-- BTNs -->
			<div class="flex flex-col justify-between">
				<section class="space-y-4 w-fit mx-auto">
					<div>
						<Label class="text-sm">Vyber scrap</Label>
						<Combobox
							dataBox={scrapCodes}
							bind:value={selectedScrapCodeId}
							reset={resetSelectedScrapCode}
						/>
					</div>

					<Button
						size={'lg'}
						variant="default"
						disabled={!selectedScrapCodeId}
						class="w-full"
						onclick={() => handleClickPlus(partNumber, findScrapCode.SC!)}>Pridat 1 scrap</Button
					>
				</section>
				<section class="mt-6">
					{#each partNotes as note}
						{#if note.partNumber === partNumber}
							<p class="flex items-center text-2xl pb-2">
								Celkove mnozstvo:<span class="font-bold text-primary mx-2">{note.quantity}</span>
							</p>
							<Separator />

							<ul class="flex flex-col italic gap-2">
								{#each note.scrapCode as item}
									<li>
										<span class="flex items-center">
											{item.sc} - <span class="text-primary font-semibold mx-2">{item.qnt}</span>
											<Button
												onclick={() => handleClickMinus(partNumber, item.sc)}
												variant="destructive"
												size="icon"
												class="size-5 mx-2"><Minus /></Button
											>
										</span>
									</li>
								{/each}
							</ul>
						{/if}
					{/each}
				</section>
			</div>
		</Dialog.Content>
	</Dialog.Root>
	<!--  -->
{/snippet}
