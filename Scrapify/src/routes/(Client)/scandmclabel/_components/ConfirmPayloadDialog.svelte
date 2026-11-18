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
		{ title: string; confirm: string; stripe: string; badge: BadgeVariant; action: string }
	> = {
		scrap: {
			title: 'Scrap',
			confirm: 'Potvrdiť scrap',
			stripe: 'border-l-destructive',
			action: 'bg-destructive text-white hover:bg-destructive/90',
			badge: scrapRecordTypeBadgeVariant.Scrap
		},
		rebuild: {
			title: 'Re-build',
			confirm: 'Potvrdiť re-build',
			stripe: 'border-l-chart-warning',
			action: 'bg-chart-warning text-background hover:bg-chart-warning/90',
			badge: scrapRecordTypeBadgeVariant.Rebuild
		},
		qntScrap: {
			title: 'Quantity scrap',
			confirm: 'Potvrdiť quantity scrap',
			stripe: 'border-l-chart-2',
			action: 'bg-chart-2 text-foreground hover:bg-chart-2/90',
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
		class="cardNormalize flex max-h-[90dvh] flex-col sm:max-w-2xl"
		interactOutsideBehavior="close"
		onOpenAutoFocus={(event) => {
			// Focus "Späť", so a scanner Enter can never confirm
			event.preventDefault();
			cancelButton?.focus();
		}}
	>
		{#if mode}
			<AlertDialog.Header>
				<AlertDialog.Title class="flex flex-wrap items-center gap-2">
					<Badge variant={MODE_TEXT[mode].badge} class="text-base">{MODE_TEXT[mode].title}</Badge>
					<span>Skontroluj pred uložením</span>
				</AlertDialog.Title>
				<AlertDialog.Description class="flex flex-wrap gap-x-4 gap-y-1">
					<span
						>Label: <span class="font-mono font-semibold text-foreground break-all"
							>{scrapManager.barcode}</span
						></span
					>
					{#if scrapManager.scanData?.vProject}
						<span
							>Project: <span class="font-semibold text-foreground"
								>{scrapManager.scanData.vProject}</span
							></span
						>
					{/if}
					<span>Karta: <span class="font-semibold text-foreground">{$operatorCardId}</span></span>
				</AlertDialog.Description>
			</AlertDialog.Header>

			<div class="-mx-2 flex min-h-0 flex-col gap-2 overflow-y-auto px-2">
				{#each mainRows as row (row.groupId)}
					{@const groupDef = groupOf(row.groupId)}
					{@const replacement = replacementOf(row)}
					<div
						class="flex items-center justify-between gap-3 rounded-lg border border-l-4 bg-card p-1.5 {MODE_TEXT[
							mode
						].stripe}"
					>
						<div class="flex min-w-0 flex-1 flex-col gap-0.5">
							<p class="flex flex-wrap items-center gap-1.5 text-lg font-extrabold">
								<span class="wrap-break-word min-w-0">{row.interfaceName}</span>
								{#if isMainReason(row)}
									<Badge variant="chart-warning">Main reason</Badge>
								{/if}
								{#if mode === 'qntScrap' && row.quantity}
									<span class="tabular-nums">{row.quantity} ks</span>
								{/if}
							</p>
							{#if row.selectedScrapCode}
								<p class="text-sm">
									<span class="font-semibold">{row.selectedScrapCode}</span>
									{#if row.selectedScrapDescription}
										<span class="text-muted-foreground"> - {row.selectedScrapDescription}</span>
									{/if}
								</p>
							{/if}
							{#if replacement}
								<p class="text-sm">
									<span class="text-muted-foreground">Iný variant: </span>
									<span class="font-semibold">{replacement}</span>
								</p>
							{/if}
						</div>
						<div class="aspect-4/3 w-28 shrink-0 max-sm:w-20">
							<GroupPhoto group={groupDef} />
						</div>
					</div>
				{/each}

				{#if otherComponentRows.length > 0}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						class="-ml-2 w-fit text-muted-foreground"
						aria-expanded={showOtherComponents}
						onclick={() => (showOtherComponents = !showOtherComponents)}
					>
						<ChevronDown
							class="size-4 transition-transform {showOtherComponents ? 'rotate-180' : ''}"
						/>
						{showOtherComponents ? 'Skryť' : `+${otherComponentRows.length}`} other component
					</Button>
					{#if showOtherComponents}
						<ul class="ml-2 flex flex-col gap-1 border-l-2 border-border pl-3">
							{#each otherComponentRows as row (row.groupId)}
								{@const causeCode = causeCodeOf(row)}
								<li class="flex items-center gap-2 text-sm">
									<div class="size-10 shrink-0">
										<GroupPhoto group={groupOf(row.groupId)} />
									</div>
									<div class="flex min-w-0 flex-col">
										<span class="wrap-break-word font-semibold">{row.interfaceName}</span>
										<span class="text-xs text-muted-foreground">
											Other component · príčina: {causeNameOf(row)}
										</span>
										{#if causeCode}
											<span class="text-xs font-semibold text-muted-foreground">{causeCode.code}</span>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>

			<p class="text-sm font-semibold">
				Vytvorí sa {scrapManager.relevantPayload.length} scrap records{mode === 'qntScrap'
					? `, spolu ${totalQuantity} ks`
					: ''}.
			</p>

			<AlertDialog.Footer>
				<AlertDialog.Cancel bind:ref={cancelButton} disabled={isSubmitting}>Späť</AlertDialog.Cancel>
				<AlertDialog.Action
					type="button"
					class={MODE_TEXT[mode].action}
					disabled={isSubmitting}
					onclick={(event) => {
						// Stay open until the server answers
						event.preventDefault();
						onconfirm();
					}}
				>
					{isSubmitting ? 'Ukladá sa...' : MODE_TEXT[mode].confirm}
				</AlertDialog.Action>
			</AlertDialog.Footer>
		{/if}
	</AlertDialog.Content>
</AlertDialog.Root>
