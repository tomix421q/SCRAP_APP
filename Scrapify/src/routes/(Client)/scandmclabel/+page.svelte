<script lang="ts">
	import Input from '@/components/ui/input/input.svelte';
	import type { PageProps } from './$types';
	import { onMount, tick } from 'svelte';
	import { DrillIcon, RefreshCw, RotateCcw, WrenchIcon } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import Button from '@/components/ui/button/button.svelte';
	import { playBeep } from '@/utils/frontHelp';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import { slide } from 'svelte/transition';
	import Rebuild from './_components/Rebuild.svelte';
	import { ScrapManager, type ScanInitPayload } from './_components/ScrapManager.svelte';
	import OperatorLogin from '@/components/molecules/OperatorLogin.svelte';
	import { cubicOut } from 'svelte/easing';
	import { operatorCardId } from '@/stores/stores';
	import Scrap from './_components/Scrap.svelte';

	let { form }: PageProps = $props();

	// vars
	const scrapManager = new ScrapManager();
	let isMounted = $state(false);
	let isSubmitting = $state(false);
	let barcodeValue = $state('SK711FL');
	let isScanning = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let status = $state<'idle' | 'success' | 'error'>('idle');

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
		inputEl?.focus();
	}

	function resetAll() {
		barcodeValue = '';
		scrapManager.reset();
		status = 'idle';
		refocus();
	}

	onMount(() => {
		isMounted = true;
		if (status === 'idle' && !scrapManager.mode) {
			refocus();
		}
	});

	// $inspect($operatorCardId);
</script>

<main class="flex flex-col lg:flex-row gap-3 justify-center">
	<div class="flex gap-3 flex-col">
		<OperatorLogin />
		<!--  -->
		<!-- SCANNER CARD && OPERATOR-->
		<article
			class="formNormalize pb-8 animate-in slide-in-to-left-50 ease-in duration-500 transition-all h-min"
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
					</section>
					<section class="">
						<div class="flex justify-center gap-4 *:text-lg *:font-bold">
							<Button
								size="lg"
								class={scrapManager.mode === 'rebuild' ? 'ring-2 ring-warning' : ''}
								onclick={() => {
									scrapManager.setMode('rebuild');
								}}
								disabled={!scrapManager.scanData || !$operatorCardId}
								><DrillIcon class="size-6" /> Re-Build</Button
							>
							<Button
								size="lg"
								class={scrapManager.mode === 'scrap' ? 'ring-2 ring-warning' : ''}
								onclick={() => {
									scrapManager.setMode('scrap');
								}}
								disabled={!scrapManager.scanData || !$operatorCardId}
								><WrenchIcon class="size-6 " /> Scrap</Button
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

	<!--  -->
	<!-- RESULT FORM -->
	{#if scrapManager.mode && status === 'success'}
		<form
			transition:slide={{ axis: 'x', duration: 350, easing: cubicOut }}
			method="POST"
			action="?/saveScrap"
			use:enhance={({ formData }) => {
				formData.set('dmc', scrapManager.barcode);
				formData.set('isRebuild', JSON.stringify(scrapManager.mode === 'rebuild' ? true : false));
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
			class="formNormalize sm:w-5xl"
		>
			{#if scrapManager.mode === 'rebuild'}
				<Rebuild {scrapManager} />
			{:else}
				<Scrap {scrapManager} />
			{/if}

			<Button type="submit" class="mt-10" disabled={isSubmitting || !scrapManager.canSubmit}>
				{#if isSubmitting}
					<span>Prebieha vytvorenie scrapu...</span>
				{:else}
					Vytvorit {scrapManager.mode === 'rebuild' ? 're-build' : 'scrap'}
				{/if}
			</Button>
		</form>
	{/if}
</main>
