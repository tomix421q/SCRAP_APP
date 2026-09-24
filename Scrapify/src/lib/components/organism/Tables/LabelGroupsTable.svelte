<script lang="ts">
	import * as Table from '@/components/ui/table';
	import type { LabelGroupsWithRelations } from '@/utils/types';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import { Info } from '@lucide/svelte';
	import EditDeleteBtns from '../../molecules/DeleteBtn.svelte';

	let {
		labelGroups,
		headerText,
		totalPages,
		labelGroupsCount
	}: {
		labelGroups: LabelGroupsWithRelations[];
		headerText?: string;
		totalPages?: number;
		labelGroupsCount?: number;
	} = $props();
</script>

<main>
	<div class="text-sm my-10 listNormalize">
		<div class="mb-2 space-y-2 md:flex w-full justify-between">
			<p class=" tracking-widest space-x-1">
				<span>Total: </span><span class="font-bold text-chart-3 text-xl"
					>{labelGroupsCount ? labelGroupsCount : '0'}</span
				>
			</p>
			<h2 class="lg:text-lg tracking-widest font-bold">{headerText}</h2>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row class="bg-chart-4/40 *:text-chart-1">
					<Table.Head class="w-[100px]">ID</Table.Head>
					<Table.Head class="w-[100px]">Code</Table.Head>
					<Table.Head class="w-[100px]">Process</Table.Head>
					<Table.Head class="w-[100px]">Project</Table.Head>
					<Table.Head colspan={1} class="text-end">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each labelGroups as item (item.id)}
					<Table.Row>
						<Table.Cell class="w-[100px]">{item.id}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.code}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.process.name}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.project.name}</Table.Cell>

						<Table.Cell class="w-[50px]">
							<div class="flex justify-end gap-2">
								<!-- <Button
									onclick={() => handleEditPartGroupRec(item)}
									variant="ghost"
									size="icon"
									title="Edit"
									class="text-chart-warning hover:text-chart-warning"
									><SquarePenIcon class="size-5!" /></Button
								> -->
								<EditDeleteBtns id={item.id} actionRoute={'?/deleteLabel'} />
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>
