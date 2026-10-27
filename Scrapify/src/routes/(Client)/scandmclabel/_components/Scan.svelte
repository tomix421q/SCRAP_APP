<script lang="ts">
	import { enhance } from '$app/forms';
	import OperatorLogin from '@/components/molecules/OperatorLogin.svelte';
	import type { ScanInitPayload, ScrapManager } from './ScrapManager.svelte';
	import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';
	import { playBeep } from '@/utils/frontHelp';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import * as Dialog from '@/components/ui/dialog';
	import {
		AlignVerticalJustifyEnd,
		DrillIcon,
		RefreshCw,
		RotateCcw,
		SendHorizontalIcon,
		WrenchIcon
	} from '@lucide/svelte';
	import { operatorCardId } from '@/stores/stores';
	import { onMount, tick } from 'svelte';
	import Input from '@/components/ui/input/input.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import type { PageProps } from '../$types';

	let {
		scrapManager,
		form,
		data,
		barcodeValue = $bindable(),
		selectedQuantityScrapLabelId = $bindable(),
		status = $bindable(),
		resetAll
	}: {
		scrapManager: ScrapManager;
		form: PageProps['form'];
		data: PageProps['data'];
		barcodeValue: string;
		selectedQuantityScrapLabelId: number | null;
		status: 'idle' | 'success' | 'error';
		resetAll: () => void;
	} = $props();

	//
	// Vars
	let isMounted = $state(false);
	let isScanning = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let isQuantityLineDialogOpen = $state(false);

	//
	// Funcs
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

	function startQuantityScrap() {
		if (!$operatorCardId || isScanning) return;
		isQuantityLineDialogOpen = true;
	}

	async function refocus() {
		await tick();
		inputEl?.focus({ preventScroll: true });
	}

	//
	// Effects
	$effect(() => {
		if (status === 'idle' && barcodeValue === '') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			void refocus();
		}
	});
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
</script>

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
							variant="ghost"
							size="icon"><SendHorizontalIcon class="size-6" /></Button
						>
					</div>
				</section>
				<!-- Btns -->
				<section class="flex flex-col gap-3 items-start mx-auto w-fit">
					<!-- Main btns first row -->
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
							variant="destructive"
							class=""
							onclick={resetAll}
							disabled={!barcodeValue}
							><RotateCcw
								class="size-6 {!barcodeValue ? 'animate-move duration-500' : ''}"
							/>Opakovat</Button
						>
					</div>
					<!-- Quantity scrap second row -->
					<Button
						size="lg"
						variant="secondary"
						class="{scrapManager.mode === 'qntScrap'
							? 'ring-2 ring-warning '
							: ''} relative text-lg"
						onclick={startQuantityScrap}
						disabled={!$operatorCardId || isScanning}
						><AlignVerticalJustifyEnd class="size-6 " />Quantity scrap
						<span
							class="absolute text-xs uppercase bg-background text-chart-1 p-0.5 rotate-45 -top-0 -right-5 rounded-lg"
							>Trial</span
						></Button
					>
				</section>
			</div>
		</form>
	</article>
</div>

<Dialog.Root bind:open={isQuantityLineDialogOpen}>
	<Dialog.Content class="cardNormalize bg-chart-1/5">
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
				<article class="mb-4">
					{#each data.quantityScrapLabels as label (label.id)}
						<Button type="button" size="lg" onclick={() => selectQuantityScrapLabel(label)}>
							{label.code.slice(quantityScrapLabelPrefix.length)}
							{#if label.vProject}
								<span class="ml-1 text-xs opacity-70">({label.vProject})</span>
							{/if}
						</Button>
					{/each}
				</article>
			{/if}
		</div>
		<Dialog.Footer>
			<Dialog.Close>
				<Button type="button" variant="destructive" class="rounded-lg">Zrušiť</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
