<script lang="ts">
	import Combobox from '@/components/atoms/Combobox.svelte';
	import type { ScrapManager, ScrapRowState } from './ScrapManager.svelte';

	let { scrapManager, row }: { scrapManager: ScrapManager; row: ScrapRowState } = $props();

	let candidates = $derived(scrapManager.causeCandidates(row.groupId));

	// e.g. "Main carrier – SA850"
	const causeLabel = (causeGroupId: number) => {
		const cause = scrapManager.scrapPayload.find((r) => r.groupId === causeGroupId);
		const code = scrapManager.otherComponentCodeOf(causeGroupId);
		return `${cause?.interfaceName ?? ''}${code ? ` – ${code.code}` : ''}`;
	};
</script>

{#if candidates.length > 1}
	<div class="flex-1 min-w-0 [&_[role=combobox]]:w-full!">
		<Combobox
			dataBox={candidates.map((cause) => ({
				id: String(cause.groupId),
				name: causeLabel(cause.groupId)
			}))}
			nameLabel="name"
			width="sm"
			value={row.otherComponentCauseGroupId?.toString() ?? ''}
			onchange={(val) => scrapManager.setOtherComponentCause(row.groupId, Number(val))}
			firstText="Zvolte príčinu"
		/>
	</div>
{:else}
	<p class="max-sm:w-full rounded-lg bg-chart-5 px-3 py-2 h-9 text-info font-semibold text-sm">
		Iný komponent{row.otherComponentCauseGroupId !== null
			? `: ${causeLabel(row.otherComponentCauseGroupId)}`
			: ''}
	</p>
{/if}
