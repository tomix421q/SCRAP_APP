<script lang="ts">
	import Input from '@/components/ui/input/input.svelte';
	import type { ActionData, PageProps } from './$types';
	import { tick } from 'svelte';
	import { DrillIcon, RefreshCw, RotateCcw, Wrench, WrenchIcon, X } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import Button from '@/components/ui/button/button.svelte';
	import { playBeep } from '@/utils/frontHelp';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import { slide } from 'svelte/transition';
	import Rebuild from './_components/Rebuild.svelte';

	let { form }: PageProps = $props();

	// vars
	let isSubmitting = $state(false);
	let barcodeValue = $state('SK54333j444');
	let isScanning = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let status = $state<'idle' | 'success' | 'error'>('idle');
	let scrapMode = $state<'rebuild' | 'scrap' | null>();

	let scanData = $derived(form?.data?.match);
	let scanDataInfo = $derived(form);

	let checkBoxes = $state<Record<string, boolean>>({});
	let otherVariantPN = $state<Record<string, string>>({});
	let scrapCodesRecord = $state<Record<string, string>>({});

	// DB prepare
	let scrapCodesRecordCode = $derived.by(() => {
		const result: Record<string, string> = {};
		for (const [groupName, selectedId] of Object.entries(scrapCodesRecord)) {
			if (!selectedId) continue;
			const group = scanData?.groups.find((g) => g.name === groupName);
			const scrap = group?.scrapCodes.find((s) => s.id.toString() === selectedId.toString());
			if (scrap) {
				result[groupName] = scrap.code;
			}
		}
		return result;
	});
	let partIdsRecordToPartNumber = $derived.by(() => {
		const result: Record<string, string> = {};
		for (const [groupName, selectedId] of Object.entries(otherVariantPN)) {
			if (!selectedId) continue;
			const _gName = scanData?.groups.find((g) => g.name === groupName);
			const _partNum = _gName?.parts.find((p) => p.id === Number(selectedId));
			if (_partNum && _gName) {
				result[_gName?.name] = _partNum.partNumber;
			}
		}
		return result;
	});
	//

	let hasAnySelection = $derived(Object.values(scrapCodesRecord).some((val) => val !== ''));

	let isMissingOtherVariantPN = $derived.by(() => {
		for (const [groupName, selectedId] of Object.entries(scrapCodesRecord)) {
			if (!selectedId) continue;
			const group = scanData?.groups.find((g) => g.name === groupName);
			const scrap = group?.scrapCodes.find((s) => s.id.toString() === selectedId.toString());
			const scrapName = scrap?.name?.toLowerCase() ?? '';

			if (scrapName.includes('iny variant') || scrapName.includes('iný variant')) {
				const chosenPN = otherVariantPN[groupName];
				if (!chosenPN || chosenPN === 'empty') {
					return true;
				}
			}
		}

		return false;
	});

	// func
	async function refocus() {
		await tick();
		inputEl?.focus();
	}

	function selectScrapForGroup(groupName: string, selectedId: string) {
		scrapCodesRecord[groupName] = selectedId;
		if (scrapMode !== 'rebuild' || !scanData?.groups) return;
		const currentGroup = scanData.groups.find((g) => g.name === groupName);

		if (currentGroup?.isRebuild) {
			//
			// Other component
			const otherRebuildGroups = scanData.groups.filter((g) => g.isRebuild && g.name !== groupName);
			const isCurGroupBadChoice = currentGroup.scrapCodes
				.find((s) => s.id === Number(selectedId))
				?.name.toLocaleLowerCase()
				.includes('iný komponent');
			if (isCurGroupBadChoice) {
				return;
			}
			if (selectedId) {
				for (const other of otherRebuildGroups) {
					checkBoxes[other.name] = true;
					scrapCodesRecord[other.name] = '';
					otherVariantPN = {};
				}

				// for (const other of otherRebuildGroups) {
				// 	const matchScrap = other.scrapCodes.find((s) => {
				// 		const sName = s.name.toLowerCase();
				// 		return (
				// 			(sName.includes('iný komponent') || sName.includes('iny komponent')) &&
				// 			sName.includes(groupName.toLowerCase())
				// 		);
				// 	});
				// 	if (matchScrap) {
				// 		scrapCodesRecord[other.name] = matchScrap.id.toString();
				// 	}
				// }
			}
		}

		//
		// Other variant
		if (selectedId) {
			const selectedScrap = currentGroup?.scrapCodes.find((sc) => sc.id === Number(selectedId));
			const scrapName = selectedScrap?.name?.toLowerCase() ?? '';

			if (scrapName.includes('iny variant') || scrapName.includes('iný variant')) {
				if (!otherVariantPN[groupName]) {
					otherVariantPN[groupName] = 'empty';
				} else {
					delete otherVariantPN[groupName];
				}
			} else {
				delete otherVariantPN[groupName];
			}
		}
	}

	// efect
	$effect(() => {
		refocus();
	});

	$inspect(scanData);
</script>

<main class="flex flex-col items-center gap-3">
	<!--  -->
	<!-- SCANNER CARD -->
	<article
		class="formNormalize sm:w-5xl mt-24 pb-8 animate-in slide-in-from-right-30 ease-in duration-200 transition-all"
	>
		<section class="flex items-center gap-3 mb-1">
			<h2 class="text-3xl mx-auto font-extrabold">Scan label</h2>
		</section>

		<form
			method="POST"
			action="?/scanDmc"
			use:enhance={() => {
				isScanning = true;
				status = 'idle';
				return async ({ result, update }) => {
					isScanning = false;
					if (result.type === 'success' && result.data) {
						status = 'success';
						// barcodeValue = '';
						playBeep('ok');
					} else if (result.type === 'failure') {
						scrapMode = null;
						status = 'error';
						playBeep('error');
						// toast.error(String(result.data?.error ?? 'Neznámy diel pre tento kód.'));
						inputEl?.select();
					}

					await update({ reset: false });
					await refocus();
				};
			}}
		>
			<div class="flex flex-1 gap-4">
				<section class="relative flex flex-col gap-8 w-full">
					<div class="min-h-[90px]">
						<ResultInfo data={form} />
						{#if isScanning}
							<RefreshCw class="mx-auto size-6 text-primary animate-spin" />
						{/if}
					</div>

					<Input
						bind:ref={inputEl}
						name="barcode"
						bind:value={barcodeValue}
						disabled={isScanning}
						placeholder={'Naskenuj diel'}
						autocomplete="off"
						autocorrect="off"
						autocapitalize="off"
						spellcheck={false}
						class="inputNormalize transition-all text-2xl! text-center text-warning font-extrabold! max-w-lg mx-auto"
					/>
				</section>
				<section class="">
					<div class="flex flex-col gap-4 *:text-lg *:font-bold">
						<Button
							size="lg"
							class=" {scrapMode === 'rebuild' ? 'ring-4 ring-warning' : ''}"
							onclick={() => {
								scrapMode = 'rebuild';
								scrapCodesRecord = {};
							}}
							disabled={!scanData}><DrillIcon class="size-6" /> Re-Build</Button
						>
						<Button
							size="lg"
							class=" {scrapMode === 'scrap' ? 'ring-4 ring-warning' : ''}"
							onclick={() => {
								scrapMode = 'scrap';
								scrapCodesRecord = {};
							}}
							disabled={!scanData}><WrenchIcon class="size-6 " /> Scrap</Button
						>
						<Button
							size="lg"
							variant="destructive"
							class=""
							onclick={() => {
								barcodeValue = '';
								refocus();
								scrapCodesRecord = {};
							}}
							disabled={!barcodeValue}
							><RotateCcw
								class="size-6 {!barcodeValue ? 'animate-move duration-500 rotate-[-360deg]' : ''}"
							/>Opakovat</Button
						>
					</div>
				</section>
			</div>
		</form>
	</article>

	<!--  -->
	<!-- RESULT FORM -->
	{#if scanDataInfo?.success && status === 'success' && scrapMode === 'rebuild'}
		{@const isRebuild = scrapMode === 'rebuild' ? true : false}
		<form
			transition:slide
			method="POST"
			action="?/saveScrap"
			use:enhance={({ formData, cancel }) => {
				formData.set('dmc', barcodeValue);
				formData.set('isRebuild', JSON.stringify(isRebuild));
				formData.set('otherVariant', JSON.stringify(partIdsRecordToPartNumber));
				formData.set('scrapCodes', JSON.stringify(scrapCodesRecordCode) as string);
				isSubmitting = true;
				return async ({ update, result }) => {
					if (result.type === 'success') {
						barcodeValue = '';
						scrapCodesRecord = {};
						otherVariantPN = {};
						checkBoxes = {};
						status = 'idle';
						scrapMode = null;
						// toast.info('Scrap bol úspešne zaevidovaný');
					}
					await update();
					await refocus();
					isSubmitting = false;
				};
			}}
			class="formNormalize sm:w-5xl"
		>
			<Rebuild
				{scanData}
				bind:scrapCodesRecord
				bind:checkBoxes
				bind:otherVariantPN
				{selectScrapForGroup}
				{hasAnySelection}
			/>

			<Button
				type="submit"
				class="mt-10"
				disabled={isSubmitting || !hasAnySelection || isMissingOtherVariantPN}
			>
				{#if isSubmitting}
					<span>Prebieha vytvorenie scrapu...</span>
				{:else}
					Vytvorit scrap
				{/if}
			</Button>
		</form>
	{:else if status === 'error'}
		<!-- <p>... </p> -->
	{/if}
</main>
