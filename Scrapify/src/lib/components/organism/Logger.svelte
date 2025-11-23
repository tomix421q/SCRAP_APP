<script lang="ts">
	import * as HoverCard from '@/components/ui/hover-card/index';
	import { dateTimmeUTCformatter } from '@/index';
	import Pagination from '../molecules/Pagination.svelte';
	import { Prisma } from '../../../../prisma/generated/client/client';

	export type ActivityLogsWithRelations = Prisma.ActivityLogsGetPayload<{
		include: { user: true };
	}>;

	let { data, totalPages }: { data: ActivityLogsWithRelations[]; totalPages: number } = $props();
	let allLogs = $derived(data);

	// $inspect(allLogs);
</script>

<main class="max-h-[800px] overflow-auto">
	<section class="mb-4">
		<div class="overflow-auto">
			{#each allLogs as log}
				<div
					class="flex gap-x-6 lg:gap-4 items-center font-mono border-b p-1 lg:px-4 hover:bg-muted-foreground/20 rounded-lg"
				>
					<span class="text-muted text-xs w-[50px]">{log.id}</span>

					<span class="text-primary text-xs md:text-lg"> {@render longItem(log.user?.name)}</span>
					<span class={log.action === '' ? 'bg-destructive' : ''}>{log.action}</span>
					<span>{log.entityType}</span>
					{#if log.entityId}
						<div>
							<span>ID: </span>
							<span class="text-primary">{log.entityId}</span>
						</div>
					{/if}
					<span class="tracking-tight text-sm text-chart-warning font-semibold"
						>{dateTimmeUTCformatter(log.timestamp)}</span
					>
				</div>
			{/each}
		</div>
	</section>
	<Pagination {totalPages} />
</main>

{#snippet longItem(desc?: string)}
	{#if desc?.length === 0 || desc === undefined}
		<p class="text-muted-foreground">Unknown</p>
	{:else}
		<HoverCard.Root>
			<HoverCard.Trigger>{desc.length > 15 ? desc?.slice(0, 15) + '...' : desc}</HoverCard.Trigger>
			<HoverCard.Content>{desc}</HoverCard.Content>
		</HoverCard.Root>
	{/if}
{/snippet}
