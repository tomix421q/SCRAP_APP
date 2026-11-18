<script lang="ts">
	import * as AlertDialog from '@/components/ui/alert-dialog';
	import { Badge, type BadgeVariant } from '@/components/ui/badge';
	import Button from '@/components/ui/button/button.svelte';
	import { operatorCardId } from '@/stores/stores';
	import { ChevronDown } from '@lucide/svelte';
	import { scrapRecordTypeBadgeVariant } from '../../scrapRecords/columns';
	import GroupPhoto from './GroupPhoto.svelte';
	import type { ScrapManager, ScrapMode, ScrapRowState } from './ScrapManager.svelte';

	let {
		open = $bindable(false),
		scrapManager,
		isSubmitting,
		onconfirm
	}: {
		open: boolean;
		scrapManager: ScrapManager;
		isSubmitting: boolean;
		onconfirm: () => void;
	} = $props();

	const MODE_TEXT: Record<
		ScrapMode,
		{
			title: string;
			confirm: string;
			stripe: string;
			badge: BadgeVariant;
			action: string;
			glow: string;
			edge: string;
		}
	> = {
		scrap: {
			title: 'Scrap',
			confirm: 'Odoslať scrap',
			stripe: 'bg-destructive',
			glow: 'var(--color-destructive)',
			edge: 'border-destructive!',
			action: 'bg-destructive! text-destructive-foreground! hover:bg-destructive/90!',
			badge: scrapRecordTypeBadgeVariant.Scrap
		},
		rebuild: {
			title: 'Re-build',
			confirm: 'Odoslať re-build',
			stripe: 'bg-chart-warning',
			glow: 'var(--color-chart-warning)',
			edge: 'border-chart-warning!',
			action: 'bg-chart-warning! text-background! hover:bg-chart-warning/90!',
			badge: scrapRecordTypeBadgeVariant.Rebuild
		},
		qntScrap: {
			title: 'Quantity scrap',
			confirm: 'Odoslať quantity scrap',
			stripe: 'bg-chart-2',
			glow: 'var(--color-chart-2)',
			edge: 'border-chart-2!',
			action: 'bg-chart-2! text-foreground! hover:bg-chart-2/90!',
			badge: scrapRecordTypeBadgeVariant['Quantity scrap']
		}
	};

	let showOtherComponents = $state(false);
	let cancelButton = $state<HTMLButtonElement | null>(null);

	let mode = $derived(scrapManager.mode);
	let mainRows = $derived(
		// Rebuild: the main reason goes first
		scrapManager.relevantPayload
			.filter((row) => !row.isOtherComponent)
			.toSorted((a, b) => Number(isMainReason(b)) - Number(isMainReason(a)))
	);
	let otherComponentRows = $derived(
		scrapManager.relevantPayload.filter((row) => row.isOtherComponent)
	);
	let totalQuantity = $derived(
		mode === 'qntScrap'
			? mainRows.reduce((sum, row) => sum + (row.quantity ?? 0), 0)
			: 0
	);

	function isMainReason(row: ScrapRowState) {
		return mode === 'rebuild' && row.isRebuildGroup && Boolean(row.selectedScrapCode);
	}
	function groupOf(groupId: number) {
		return scrapManager.scanData?.groups.find((g) => g.id === groupId);
	}
	function causeNameOf(row: ScrapRowState) {
		const causeId = row.otherComponentCauseGroupId;
		return causeId === null ? '' : (groupOf(causeId)?.interfaceName ?? '');
	}
	function causeCodeOf(row: ScrapRowState) {
		const causeId = row.otherComponentCauseGroupId;
		return causeId === null ? undefined : scrapManager.otherComponentCodeOf(causeId);
	}
	function replacementOf(row: ScrapRowState) {
		const material = row.replacementPartMaterial;
		if (!row.isOtherVariant && mode !== 'qntScrap') return null;
		return material && material !== 'empty' ? material : null;
	}
</script>

<AlertDialog.Root
	{open}
	onOpenChange={(next) => {
		// Closing is blocked while saving
		if (!next && isSubmitting) return;
		open = next;
		if (!next) showOtherComponents = false;
	}}
>
	<AlertDialog.Content
		class="cardNormalize border-2! {mode ? MODE_TEXT[mode].edge : ''} flex max-h-[90dvh] flex-col gap-6 bg-background/90! p-8 backdrop-blur-md max-sm:p-5 sm:max-w-2xl"
		interactOutsideBehavior="close"
		onOpenAutoFocus={(event) => {
			// Focus "Späť", so a scanner Enter can never confirm
			event.preventDefault();
			cancelButton?.focus();
		}}
	>
		{#if mode}
			<AlertDialog.Header class="gap-4">
				<AlertDialog.Title class="flex flex-wrap items-center gap-3 text-xl">
					<Badge variant={MODE_TEXT[mode].badge} class="px-3 py-1 text-base"
						>{MODE_TEXT[mode].title}</Badge
					>
					<span>Skontroluj pred uložením</span>
				</AlertDialog.Title>
				<AlertDialog.Description class="flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-muted/40 px-4 py-3">
					{@render metaItem('Label', scrapManager.barcode, true)}
					{#if scrapManager.scanData?.vProject}
						{@render metaItem('Project', scrapManager.scanData.vProject)}
					{/if}
					{@render metaItem('Karta', String($operatorCardId))}
				</AlertDialog.Description>
			</AlertDialog.Header>

			<div class="-mx-2 flex min-h-0 flex-col gap-3 overflow-y-auto px-2 py-1">
				{#each mainRows as row (row.groupId)}
					{@const replacement = replacementOf(row)}
					<div
						class="relative flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-border bg-card py-4 pr-4 pl-6"
					>
						<span class="absolute inset-y-0 left-0 w-1.5 {MODE_TEXT[mode].stripe}"></span>
						<div class="flex min-w-0 flex-1 flex-col gap-2">
							<p class="flex flex-wrap items-center gap-2 text-xl leading-tight font-extrabold">
								<span class="wrap-break-word min-w-0">{row.interfaceName}</span>
								{#if isMainReason(row)}
									<Badge variant="chart-warning" class="px-3 py-1 text-sm">Main reason</Badge>
								{/if}
								{#if mode === 'qntScrap' && row.quantity}
									<Badge variant="chart-2" class="tabular-nums">{row.quantity} ks</Badge>
								{/if}
							</p>
							{#if row.selectedScrapCode}
								<p class="text-base leading-snug">
									<span class="font-semibold">{row.selectedScrapCode}</span>
									{#if row.selectedScrapDescription}
										<span class="text-muted-foreground"> – {row.selectedScrapDescription}</span>
									{/if}
								</p>
							{/if}
							{#if replacement}
								<p class="text-base">
									<span class="text-muted-foreground">Iný variant:</span>
									<span class="font-semibold">{replacement}</span>
								</p>
							{/if}
						</div>
						<div class="aspect-4/3 w-36 shrink-0 max-sm:w-24">
							<GroupPhoto group={groupOf(row.groupId)} />
						</div>
					</div>
				{/each}

				{#if otherComponentRows.length > 0}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						class="w-fit text-muted-foreground"
						aria-expanded={showOtherComponents}
						onclick={() => (showOtherComponents = !showOtherComponents)}
					>
						<ChevronDown
							class="size-4 transition-transform {showOtherComponents ? 'rotate-180' : ''}"
						/>
						{showOtherComponents ? 'Skryť' : `+${otherComponentRows.length}`} other component
					</Button>
					{#if showOtherComponents}
						<ul class="ml-3 flex flex-col gap-2 border-l-2 border-border pl-4">
							{#each otherComponentRows as row (row.groupId)}
								{@const causeCode = causeCodeOf(row)}
								<li class="flex items-center gap-3 rounded-lg bg-muted/30 p-2 text-sm">
									<div class="size-10 shrink-0">
										<GroupPhoto group={groupOf(row.groupId)} />
									</div>
									<div class="flex min-w-0 flex-1 flex-col gap-0.5">
										<span class="wrap-break-word font-semibold">{row.interfaceName}</span>
										<span class="text-xs text-muted-foreground">
											Other component · príčina: {causeNameOf(row)}
										</span>
									</div>
									{#if causeCode}
										<span class="shrink-0 text-xs font-semibold text-muted-foreground"
											>{causeCode.code}</span
										>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>

			<AlertDialog.Footer class="items-center gap-4 sm:justify-between">
				<p class="text-sm text-muted-foreground">
					Vytvorí sa <span class="font-bold text-foreground"
						>{scrapManager.relevantPayload.length} scrap records</span
					>{mode === 'qntScrap' ? `, spolu ${totalQuantity} ks` : ''}
				</p>
				<div class="flex flex-col-reverse gap-2 sm:flex-row">
					<AlertDialog.Cancel bind:ref={cancelButton} disabled={isSubmitting}>Späť</AlertDialog.Cancel>
					<AlertDialog.Action
						type="button"
						class="{MODE_TEXT[mode].action} {isSubmitting ? '' : 'confirm-pulse'}"
						style="--glow: {MODE_TEXT[mode].glow}"
						disabled={isSubmitting}
						onclick={(event) => {
							// Stay open until the server answers
							event.preventDefault();
							onconfirm();
						}}
					>
						{isSubmitting ? 'Ukladá sa...' : MODE_TEXT[mode].confirm}
					</AlertDialog.Action>
				</div>
			</AlertDialog.Footer>
		{/if}
	</AlertDialog.Content>
</AlertDialog.Root>

{#snippet metaItem(label: string, value: string, mono = false)}
	<span class="flex items-baseline gap-2">
		<span class="text-sm text-muted-foreground">{label}:</span>
		<span class="font-semibold text-foreground break-all {mono ? 'font-mono' : ''}">{value}</span>
	</span>
{/snippet}

<style>
	/* Soft glow that invites the click without distracting; off for reduced motion */
	:global(.confirm-pulse) {
		animation: confirm-pulse 2.4s ease-in-out infinite;
	}
	@keyframes confirm-pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--glow) 0%, transparent);
		}
		50% {
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--glow) 28%, transparent);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.confirm-pulse) {
			animation: none;
		}
	}
</style>
