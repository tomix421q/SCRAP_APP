<script lang="ts">
	import { deserialize } from '$app/forms';
	import ResultInfo, { type ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
	import { Badge } from '@/components/ui/badge';
	import Button from '@/components/ui/button/button.svelte';
	import * as Dialog from '@/components/ui/dialog';
	import { operatorCardId } from '@/stores/stores';
	import { History, RefreshCw } from '@lucide/svelte';
	import { operatorHistoryLimit, type OperatorHistory, type OperatorHistoryMode } from '../history';

	const modeLabels: Record<OperatorHistoryMode, string> = {
		Scrap: 'Scrap',
		Rebuild: 'Rebuild',
		'Quantity scrap': 'Quantity'
	};
	const modeVariants = {
		Scrap: 'outline',
		Rebuild: 'chart-warning',
		'Quantity scrap': 'chart-2'
	} as const satisfies Record<OperatorHistoryMode, string>;

	let isOpen = $state(false);
	let isLoading = $state(false);
	let history = $state<OperatorHistory>();
	let loadError = $state<ResultInfoData>();
	/** Increments per request so a late response cannot overwrite a newer one. */
	let requestId = 0;

	function isOperatorHistory(value: unknown): value is OperatorHistory {
		return (
			typeof value === 'object' &&
			value !== null &&
			'entries' in value &&
			Array.isArray(value.entries) &&
			'limitReached' in value
		);
	}

	async function openHistory() {
		const currentRequest = ++requestId;
		isOpen = true;
		isLoading = true;
		history = undefined;
		loadError = undefined;

		try {
			const body = new FormData();
			body.set('operator', $operatorCardId);
			const response = await fetch('/scandmclabel?/history', {
				method: 'POST',
				headers: { 'x-sveltekit-action': 'true' },
				body
			});
			const result = deserialize(await response.text());
			if (currentRequest !== requestId) return;

			if (result.type === 'success' && isOperatorHistory(result.data)) {
				history = result.data;
			} else if (result.type === 'failure') {
				const data = result.data as Partial<ResultInfoData> | undefined;
				loadError = {
					success: false,
					message: data?.message ?? 'Nepodarilo sa načítať históriu.',
					error: data?.error
				};
			} else {
				loadError = { success: false, message: 'Nepodarilo sa načítať históriu.' };
			}
		} catch {
			if (currentRequest !== requestId) return;
			loadError = {
				success: false,
				message: 'Nepodarilo sa načítať históriu.',
				error: 'Skontroluj pripojenie a skús to znova.'
			};
		} finally {
			if (currentRequest === requestId) isLoading = false;
		}
	}
</script>

<Button type="button" variant="outline" size="sm" onclick={openHistory} disabled={!$operatorCardId}>
	<History class="size-4" />História
</Button>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Content class="cardNormalize max-h-[90dvh] flex flex-col sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Moje scrapy od polnoci</Dialog.Title>
			<Dialog.Description
				>Záznamy uložené pod kartou {$operatorCardId}, najnovšie hore.</Dialog.Description
			>
		</Dialog.Header>

		<div class="min-h-24 overflow-y-auto -mx-2 px-2">
			{#if isLoading}
				<p class="flex items-center justify-center gap-2 py-8 text-muted-foreground">
					<RefreshCw class="size-5 animate-spin text-primary" /> Načítavam…
				</p>
			{:else if loadError}
				<ResultInfo data={loadError} />
			{:else if history && history.entries.length === 0}
				<p class="py-8 text-center text-muted-foreground">
					Od polnoci nemáš uložený žiadny záznam.
				</p>
			{:else if history}
				<ul class="divide-y divide-border">
					{#each history.entries as entry (entry.id)}
						<li class="flex flex-col gap-1 py-2">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-semibold tabular-nums">{entry.time}</span>
								<span class="font-mono font-semibold text-primary break-all">{entry.dmc}</span>
								<Badge variant={modeVariants[entry.mode]}>{modeLabels[entry.mode]}</Badge>
								{#if entry.quantity !== 1}
									<span class="font-semibold tabular-nums">{entry.quantity} ks</span>
								{/if}
								<span
									class="ml-auto text-xs {entry.qadExported
										? 'text-chart-success'
										: 'text-muted-foreground'}"
								>
									QAD: {entry.qadExported ? 'áno' : 'nie'}
								</span>
							</div>
							<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
								<span class="text-foreground">{entry.partGroupName}</span>
								{#if entry.scrapCode || entry.scrapCodeDescription}
									<span>
										{entry.scrapCode ?? ''}{entry.scrapCode && entry.scrapCodeDescription
											? ' · '
											: ''}{entry.scrapCodeDescription ?? ''}
									</span>
								{/if}
								{#if entry.isOtherComponent}
									<Badge variant="outline" class="text-muted-foreground">Iný komponent</Badge>
								{/if}
								{#if entry.replacementPartMaterial}
									<Badge variant="default">Iný variant: {entry.replacementPartMaterial}</Badge>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
				{#if history.limitReached}
					<p class="pt-2 text-center text-xs text-muted-foreground">
						Zobrazených posledných {operatorHistoryLimit}
					</p>
				{/if}
			{/if}
		</div>

		<Dialog.Footer>
			<Dialog.Close>
				{#snippet child({ props })}
					<Button {...props} variant="outline">Zavrieť</Button>
				{/snippet}
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
