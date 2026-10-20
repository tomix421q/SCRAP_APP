<script lang="ts">
	import * as Table from '@/components/ui/table';
	import * as HoverCard from '@/components/ui/hover-card/index';
	import type { vParts } from '@prisma/client';

	let {
		parts,
		headerText,
		partsCount
	}: {
		parts: vParts[];
		partsCount?: number;
		headerText?: string;
	} = $props();

	// $inspect(parts);
</script>

<main>
	<div class="text-sm my-10 listNormalize">
		<div class="mb-2 space-y-2 md:flex w-full justify-between">
			<p class=" tracking-widest space-x-1">
				<span>Total: </span><span class="font-bold text-chart-3 text-xl"
					>{partsCount ? partsCount : '0'}</span
				>
			</p>
			<h2 class="lg:text-lg tracking-widest font-bold">{headerText}</h2>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row class="bg-chart-4/40 *:text-chart-1">
					<!-- <Table.Head class="w-[100px]">ID</Table.Head> -->
					<Table.Head class="w-[100px] border">Part Number</Table.Head>
					<Table.Head class="w-[100px] border">Side</Table.Head>
					<Table.Head class="w-[100px] border">Project</Table.Head>
					<Table.Head class="w-[100px] border">Hall</Table.Head>
					<Table.Head class="w-[200px] border">Description</Table.Head>
					<!-- <Table.Head colspan={1} class="text-end">Actions</Table.Head> -->
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each parts as item (item)}
					<Table.Row>
						<!-- <Table.Cell class="w-[100px]">{item.id}</Table.Cell> -->
						<Table.Cell class="w-[100px] border">{item.Material}</Table.Cell>
						<Table.Cell class="w-[100px] border">{item.Side}</Table.Cell>
						<Table.Cell class="w-[100px] border">{item.Project}</Table.Cell>
						<Table.Cell class="w-[150px] border">{item.Hall}</Table.Cell>
						<Table.Cell class="w-[200px] border">
							<HoverCard.Root>
								<HoverCard.Trigger class="text-xs"
									>{item.Description && item.Description?.length > 50
										? item.Description?.slice(0, 50) + '...'
										: item.Description}</HoverCard.Trigger
								>
								<HoverCard.Content>{item.Description}</HoverCard.Content>
							</HoverCard.Root>
						</Table.Cell>
						<!-- <Table.Cell class="w-[50px]">
							<div class="flex justify-end gap-2">
								<Button
									onclick={() => handleEditPartRec(item)}
									variant="ghost"
									size="icon"
									title="Edit"
									class="text-chart-warning hover:text-chart-warning"
									><SquarePenIcon class="size-5!" /></Button
								>
								<EditDeleteBtns id={item.id} actionRoute={'?/deletePart'} />
							</div>
						</Table.Cell> -->
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>
