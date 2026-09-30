<script lang="ts">
	import Input from '@/components/ui/input/input.svelte';
	import type { PageProps } from './$types';
	import { tick } from 'svelte';
	import { RefreshCw, X } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import Button from '@/components/ui/button/button.svelte';
	import { playBeep } from '@/utils/frontHelp';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import Label from '@/components/ui/label/label.svelte';

	let { form }: PageProps = $props();

	// vars
	let isSubmitting = $state(false);
	let barcodeValue = $state('SK22222');
	let isScanning = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let status = $state<'idle' | 'success' | 'error'>('idle');
	let scanData = $derived(form?.data?.match);
	// let scrapCodes = $derived(form?.data?.scrapCodes);
	let scanDataInfo = $derived(form);

	let scrapCodesRecord = $state<Record<string, string>>({});
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
	let hasAnySelection = $derived(Object.values(scrapCodesRecord).some((val) => val !== ''));

	// func
	async function refocus() {
		await tick();
		inputEl?.focus();
	}

	// efect
	$effect(() => {
		refocus();
	});

	$inspect(scrapCodesRecordCode);
</script>

<main class="flex flex-col items-center gap-3">
	<!--  -->
	<!-- SCANNER CARD -->
	<article class="formNormalize sm:w-xl mt-24 pb-8">
		<section class="flex items-center gap-3 mb-1">
			<h2 class="text-3xl mx-auto font-extrabold">Scan DMC label</h2>
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
			<div class="relative flex flex-col gap-8">
				<div class="min-h-[80px] p-1">
					<ResultInfo data={form} />
					{#if isScanning}
						<RefreshCw class="mx-auto size-8 text-primary animate-spin" />
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
			</div>
		</form>
	</article>
	<article class="w-fit"></article>

	<!--  -->
	<!-- RESULT FORM -->
	{#if scanDataInfo?.success && status === 'success'}
		<form
			method="POST"
			action="?/saveScrap"
			use:enhance={({ formData, cancel }) => {
				formData.set('dmc', barcodeValue);
				formData.set('scrapCodes', JSON.stringify(scrapCodesRecordCode) as string);
				isSubmitting = true;
				return async ({ update, result }) => {
					if (result.type === 'success') {
						barcodeValue = '';
						scrapCodesRecord = {};
						status = 'idle';
						// toast.info('Scrap bol úspešne zaevidovaný');
					}
					await update();
					await refocus();
					isSubmitting = false;
				};
			}}
			class="formNormalize"
		>
			{#each scanData?.groups as group, index}
				{@const checkboxScrapCode = group.scrapCodes.find((i) => i.name === 'Iný komponent')}
				<article class="flex items-center justify-between flex-col sm:flex-row gap-6">
					<p class="text-xl font-semibold">{group.name}</p>

					<!-- {@const availableScrapCodes = scrapCodes.filter((c) => c.name.includes(group.name))} -->
					<div class="flex gap-2 min-w-xl justify-end">
						<Button
							title="Remove item"
							size="icon"
							variant="ghost"
							class={scrapCodesRecord[group.name]?.length > 0
								? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
								: 'hidden'}
							onclick={() => {
								scrapCodesRecord[group.name] = '';
							}}><X /></Button
						>
						<Combobox
							dataBox={group.scrapCodes}
							nameLabel="codeName"
							id="dmcScrapCode"
							bind:value={scrapCodesRecord[group.name]}
							reset
						/>

						{#if checkboxScrapCode}
							<div class="flex items-center gap-2 ml-4">
								<Label for={`other-${group.name}`}>{checkboxScrapCode.name}</Label>
								<Checkbox
									id={`other-${group.name}`}
									class="size-5! ring-2 ring-primary **:size-5"
									checked={scrapCodesRecord[group.name] === checkboxScrapCode.id.toString()}
									onCheckedChange={(val: any) => {
										if (val) {
											scrapCodesRecord[group.name] = checkboxScrapCode.id.toString();
										} else {
											scrapCodesRecord[group.name] = '';
										}
									}}
								/>
							</div>
						{/if}
					</div>
				</article>
			{/each}

			<Button type="submit" class="mt-10" disabled={isSubmitting || !hasAnySelection}>
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
