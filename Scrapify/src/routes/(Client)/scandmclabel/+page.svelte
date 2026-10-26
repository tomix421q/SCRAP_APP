<script lang="ts">
	import Input from '@/components/ui/input/input.svelte';
	import type { PageProps } from './$types';
	import { onMount, tick } from 'svelte';
	import {
		AlignVerticalJustifyEnd,
		DrillIcon,
		RefreshCw,
		RotateCcw,
		SendHorizontalIcon,
		WrenchIcon
	} from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import Button from '@/components/ui/button/button.svelte';
	import { playBeep } from '@/utils/frontHelp';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Rebuild from './_components/Rebuild.svelte';
	import { ScrapManager, type ScanInitPayload } from './_components/ScrapManager.svelte';
	import OperatorLogin from '@/components/molecules/OperatorLogin.svelte';
	import { operatorCardId } from '@/stores/stores';
	import Scrap from './_components/Scrap.svelte';
	import QuantityScrap from './_components/QuantityScrap.svelte';
	import * as Dialog from '@/components/ui/dialog';
	import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';

	let { form, data }: PageProps = $props();

	// for testing
	let randomNumber = $state(Math.floor(100 * Math.random()));
	// vars
	const scrapManager = new ScrapManager();
	let isMounted = $state(false);
	let isSubmitting = $state(false);
	let barcodeValue = $state('X4' + randomNumber);
	let isScanning = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let scanFormEl = $state<HTMLFormElement | null>(null);
	let status = $state<'idle' | 'success' | 'error'>('idle');
	let isQuantityLineDialogOpen = $state(false);
	let selectedQuantityScrapLabelId = $state<number | null>(null);

	// func
	function isScanSuccessData(value: unknown): value is { data: ScanInitPayload } {
		if (typeof value !== 'object' || value === null || !('data' in value)) return false;
		const payload = value.data;
		if (
			typeof payload !== 'object' ||
			payload === null ||
			!('label' in payload) ||
			!('match' in payload)
		) {
			return false;
		}
		const match = payload.match;
		return (
			typeof payload.label === 'string' &&
			typeof match === 'object' &&
			match !== null &&
			'groups' in match &&
			Array.isArray(match.groups)
		);
	}

	async function refocus() {
		await tick();
		inputEl?.focus({ preventScroll: true });
	}

	function resetAll() {
		barcodeValue = '';
		selectedQuantityScrapLabelId = null;
		scrapManager.reset();
		status = 'idle';
		refocus();
	}

	function startQuantityScrap() {
		if (!$operatorCardId || isScanning) return;
		isQuantityLineDialogOpen = true;
	}

	function selectQuantityScrapLabel(label: (typeof data.quantityScrapLabels)[number]) {
		if (!$operatorCardId || isScanning) return;
		selectedQuantityScrapLabelId = label.id;
		isQuantityLineDialogOpen = false;
		barcodeValue = label.code;
		scrapManager.init({ label: label.code, match: label }, label.code);
		scrapManager.setMode('qntScrap');
		status = 'success';
		playBeep('ok');
	}

	$effect(() => {
		if (scrapManager.mode) {
			const target = document.getElementById('scrap');
			if (target) {
				target.scrollIntoView({ block: 'start', behavior: 'smooth' });
			}
		}
	});

	onMount(() => {
		isMounted = true;
		if (status === 'idle' && !scrapManager.mode) {
			refocus();
		}
	});

	// $inspect($operatorCardId);
</script>

<main class="flex flex-col gap-3 items-center">
	<div id="scan" class="flex gap-3 flex-col">
		<OperatorLogin />
		<!--  -->
		<!-- SCANNER CARD && OPERATOR-->
		<article
			class="formNormalize pb-8 animate-in max-w-lg slide-in-to-left-50 ease-in duration-500 transition-all h-min"
		>
			<section class="flex items-center gap-3 mb-1 mt-4">
				<h2 class="text-3xl mx-auto font-extrabold">Scan label</h2>
			</section>

			<form
				bind:this={scanFormEl}
				method="POST"
				action="?/scanDmc"
				use:enhance={() => {
					isScanning = true;
					status = 'idle';
					return async ({ result, update }) => {
						isScanning = false;
						if (result.type === 'success' && isScanSuccessData(result.data)) {
							status = 'success';
							scrapManager.init(result.data.data, barcodeValue);
							if (result.data.data.match.code.startsWith(quantityScrapLabelPrefix)) {
								selectedQuantityScrapLabelId = result.data.data.match.id;
								scrapManager.setMode('qntScrap');
							} else {
								selectedQuantityScrapLabelId = null;
							}
							playBeep('ok');
						} else {
							status = 'error';
							playBeep('error');
							inputEl?.select();
						}

						await update({ reset: false });
						await refocus();
					};
				}}
			>
				<div class="flex flex-col gap-4">
					<section class="relative flex flex-col gap-8">
						<div class="min-h-[90px] relative">
							<ResultInfo data={form} />
							{#if isScanning}
								<RefreshCw class="mx-auto size-6 text-primary animate-spin" />
							{/if}
							{#if !$operatorCardId && isMounted}
								<p class="text-destructive font-semibold text-center p-1 rounded-lg bg-black">
									Je potrebne sa prihlasit
								</p>
							{/if}
						</div>
						<div class="relative">
							<Input
								bind:ref={inputEl}
								name="barcode"
								bind:value={barcodeValue}
								disabled={isScanning}
								placeholder="Naskenuj diel"
								autocomplete="off"
								autocorrect="off"
								autocapitalize="off"
								spellcheck={false}
								class="inputNormalize transition-all text-2xl! text-center text-warning font-extrabold! max-w-lg mx-auto"
							/>
							<Button
								type="submit"
								class="absolute -top-2 right-13 text-chart-1"
								variant="outline"
								size="icon"><SendHorizontalIcon class="size-5" /></Button
							>
						</div>
					</section>
					<section class="">
						<div class="flex justify-center gap-4 *:text-lg *:font-bold">
							<Button
								size="lg"
								class={scrapManager.mode === 'rebuild' ? 'ring-2 ring-warning' : ''}
								onclick={() => {
									scrapManager.setMode('rebuild');
								}}
								disabled={!scrapManager.scanData ||
									!$operatorCardId ||
									scrapManager.mode === 'qntScrap'}><DrillIcon class="size-6" /> Re-Build</Button
							>
							<Button
								size="lg"
								class={scrapManager.mode === 'scrap' ? 'ring-2 ring-warning' : ''}
								onclick={() => {
									scrapManager.setMode('scrap');
								}}
								disabled={!scrapManager.scanData ||
									!$operatorCardId ||
									scrapManager.mode === 'qntScrap'}><WrenchIcon class="size-6 " /> Scrap</Button
							>
							<Button
								size="lg"
								class={scrapManager.mode === 'qntScrap' ? 'ring-2 ring-warning relative' : 'relative'}
								onclick={startQuantityScrap}
								disabled={!$operatorCardId || isScanning}
								><AlignVerticalJustifyEnd class="size-6 " />Quant <span class="absolute text-xs -top-3 -right-2 uppercase bg-background p-1 rounded-sm">Trial</span></Button
							>
							<Button
								size="lg"
								variant="destructive"
								class=""
								onclick={resetAll}
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
	</div>

	<Dialog.Root bind:open={isQuantityLineDialogOpen}>
		<Dialog.Content class="cardNormalize">
			<Dialog.Header>
				<Dialog.Title>Vyber projekt pre quantity scrap</Dialog.Title>
				<Dialog.Description>Záznamy budú uložené pod tymto projektom.</Dialog.Description>
			</Dialog.Header>
			<div class="grid grid-cols-2 gap-3">
				{#if data.quantityScrapLabels.length === 0}
					<p class="col-span-2 text-center text-muted-foreground">
						V databáze nie sú nakonfigurované žiadne quantity scrap labely.
					</p>
				{:else}
					{#each data.quantityScrapLabels as label (label.id)}
						<Button type="button" size="lg" onclick={() => selectQuantityScrapLabel(label)}>
							{label.code.slice(quantityScrapLabelPrefix.length)}
							{#if label.vProject}
								<span class="ml-1 text-xs opacity-70">({label.vProject})</span>
							{/if}
						</Button>
					{/each}
				{/if}
			</div>
			<Dialog.Footer>
				<Dialog.Close>
					<Button type="button" variant="destructive" class='rounded-lg'>Zrušiť</Button>
				</Dialog.Close>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!--  -->
	<!-- RESULT FORM -->
	{#if scrapManager.mode && status === 'success'}
		<form
			method="POST"
			action={scrapManager.mode === 'qntScrap' ? '?/saveQuantityScrap' : '?/saveScrap'}
			use:enhance={({ formData }) => {
				formData.set('dmc', scrapManager.barcode);
				if (scrapManager.mode !== 'qntScrap') {
					formData.set('isRebuild', JSON.stringify(scrapManager.mode === 'rebuild'));
				} else {
					formData.set('labelGroupId', String(selectedQuantityScrapLabelId ?? ''));
				}
				formData.set('operator', $operatorCardId);
				formData.set('scrapPayload', JSON.stringify(scrapManager.relevantPayload));
				isSubmitting = true;

				return async ({ update, result }) => {
					await update({ reset: false });
					isSubmitting = false;
					if (result.type === 'success') {
						resetAll();
					}
				};
			}}
			class="formNormalize w-full"
			id="scrap"
		>
			{#if scrapManager.mode === 'rebuild'}
				<Rebuild {scrapManager} />
			{:else if scrapManager.mode === 'scrap'}
				<Scrap {scrapManager} />
			{:else if scrapManager.mode === 'qntScrap'}
				<QuantityScrap {scrapManager} />
			{/if}

			<Button type="submit" class="mt-10" disabled={isSubmitting || !scrapManager.canSubmit}>
				{#if isSubmitting}
					<span>Prebieha vytvorenie scrapu...</span>
				{:else}
					{scrapManager.mode === 'qntScrap'
						? 'Uložiť quantity scrap'
						: `Vytvoriť ${scrapManager.mode === 'rebuild' ? 're-build' : 'scrap'}`}
				{/if}
			</Button>
		</form>
	{/if}
</main>
