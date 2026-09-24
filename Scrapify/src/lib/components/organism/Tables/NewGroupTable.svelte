<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import * as Table from '@/components/ui/table';
	import type { PartGroupWithRelations } from '@/utils/types';
	import { Info, SquarePenIcon } from '@lucide/svelte';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import EditDeleteBtns from '../../molecules/DeleteBtn.svelte';
	import type { PartGroup } from '@prisma/client';

	let {
		groups,
		headerText,
		totalPages,
		groupsCount
	}: {
		groups: PartGroupWithRelations[];
		headerText?: string;
		totalPages?: number;
		groupsCount?: number;
	} = $props();

	function handleEditPartGroupRec(item: PartGroup) {
		// editPartData.set(item);
		// window.scrollTo({ top: 0, behavior: 'instant' });
	}
	// $inspect(groups);
</script>

<main>
	<div class="text-sm my-10 listNormalize">
		<div class="mb-2 space-y-2 md:flex w-full justify-between">
			<p class=" tracking-widest space-x-1">
				<span>Total: </span><span class="font-bold text-chart-3 text-xl"
					>{groupsCount ? groupsCount : '0'}</span
				>
			</p>
			<h2 class="lg:text-lg tracking-widest font-bold">{headerText}</h2>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row class="bg-chart-4/40 *:text-chart-1">
					<Table.Head class="w-[100px]">ID</Table.Head>
					<Table.Head class="w-[100px]">Name</Table.Head>
					<Table.Head class="w-[100px]">Parts</Table.Head>
					<Table.Head class="w-[100px]">Process</Table.Head>
					<Table.Head class="w-[100px]">Project</Table.Head>
					<Table.Head colspan={1} class="text-end">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each groups as item (item.id)}
					<Table.Row>
						<Table.Cell class="w-[100px]">{item.id}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.name}</Table.Cell>
						<Table.Cell class="w-[100px]"
							><p class="flex gap-2">
								{item.parts.length}
								{#if item.parts.length > 0}
									<HoverCard.Root>
										<HoverCard.Trigger>
											<Info
												class="size-5 text-muted-foreground hover:cursor-pointer"
											/></HoverCard.Trigger
										>
										<HoverCard.Content>
											{#each item.parts as part (part.id)}
												<ul class="">
													<li class="flex gap-2 hover:bg-background p-1">
														<p class="">
															<span class="text-muted-foreground">ID:</span>{part.id}
														</p>
														<p>
															<span class="text-muted-foreground">PART_NUMBER:</span
															>{part.partNumber}
														</p>
													</li>
												</ul>
											{/each}
										</HoverCard.Content>
									</HoverCard.Root>
								{/if}
							</p></Table.Cell
						>
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
								<EditDeleteBtns id={item.id} actionRoute={'?/deleteGroup'} />
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>
