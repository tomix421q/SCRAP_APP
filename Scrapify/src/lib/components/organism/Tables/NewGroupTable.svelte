<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import * as Table from '@/components/ui/table';
	import type { PartGroupWithRelations } from '@/utils/types';
	import { Info, SquarePenIcon } from '@lucide/svelte';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import EditDeleteBtns from '../../molecules/DeleteBtn.svelte';
	import { editPartGroupData } from '@/stores/stores';

	let {
		groups,
		headerText,
		groupsCount
	}: {
		groups: PartGroupWithRelations[];
		headerText?: string;
		groupsCount?: number;
	} = $props();

	function handleEditPartGroupRec(item: PartGroupWithRelations) {
		editPartGroupData.set(item);
		window.scrollTo({ top: 0, behavior: 'instant' });
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
		<article class="overflow-x-auto">
			<Table.Root class="lg:table-fixed w-full">
				<Table.Header>
					<Table.Row class="bg-chart-4/40 *:text-chart-1 *:border">
						<Table.Head class="w-20">ID</Table.Head>
						<Table.Head class="min-w-30 max-w-60">Name</Table.Head>
						<Table.Head class="min-w-30 max-w-60">UI name</Table.Head>
						<Table.Head class="min-w-30 max-w-60">Project</Table.Head>

						<Table.Head class="min-w-20 max-w-30">Parts</Table.Head>
						<Table.Head class="min-w-20 max-w-30">Scrap codes</Table.Head>
						<Table.Head class="w-30">Qad identity</Table.Head>
						<Table.Head class="w-30">Rebuild g.</Table.Head>

						<Table.Head class="text-end">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body class="">
					{#each groups as item (item.id)}
						<Table.Row class="*:border *:truncate">
							<Table.Cell class="">{item.id}</Table.Cell>
							<Table.Cell class="" title={item.name}>{item.name}</Table.Cell>
							<Table.Cell class="">{item.interfaceName}</Table.Cell>
							<Table.Cell class="">{item.vProject}</Table.Cell>

							<!--  -->
							<!-- Parts -->
							<Table.Cell class=""
								><p class="flex gap-2">
									{item.materials.length}
									{#if item.materials.length > 0}
										<HoverCard.Root>
											<HoverCard.Trigger>
												<Info
													class="size-5 text-muted-foreground hover:cursor-pointer"
												/></HoverCard.Trigger
											>
											<HoverCard.Content class="p-2 flex flex-col flex-1 w-max">
												{#each item.materials as part (part.material)}
													<ul>
														<li
															class="flex gap-4 hover:bg-background p-2 justify-between rounded-lg"
														>
															<!-- <p class="">
															<span class="text-muted-foreground">ID:</span>{material.material}
														</p> -->
															<p>
																<span class="text-muted-foreground">PART_NUMBER:</span
																>{part.material}
															</p>
														</li>
													</ul>
												{/each}
											</HoverCard.Content>
										</HoverCard.Root>
									{/if}
								</p></Table.Cell
							>
							<!--  -->
							<!-- Scrap codes -->
							<Table.Cell class=""
								><p class="flex gap-2">
									{item.scrapCodes.length}
									{#if item.scrapCodes.length > 0}
										<HoverCard.Root>
											<HoverCard.Trigger>
												<Info
													class="size-5 text-muted-foreground hover:cursor-pointer"
												/></HoverCard.Trigger
											>
											<HoverCard.Content class="w-max p-2 flex flex-col">
												{#each item.scrapCodes as scrapC (scrapC.id)}
													<ul>
														<li class="flex gap-4 hover:bg-background p-2 rounded-lg">
															<p>
																<span class="text-muted-foreground">ID:</span>{scrapC.id}
															</p>
															<p>
																<span class="text-muted-foreground">NAME:</span>{scrapC.name}
															</p>
															<p>
																<span class="text-muted-foreground">CODE:</span>{scrapC.code}
															</p>
														</li>
													</ul>
												{/each}
											</HoverCard.Content>
										</HoverCard.Root>
									{/if}
								</p></Table.Cell
							>
							<Table.Cell class="">{item.qadIdentity?.slice(0, 1)}</Table.Cell>
							<Table.Cell class="">{item.isRebuild}</Table.Cell>

							<Table.Cell class="">
								<div class="flex justify-end gap-2">
									<Button
										onclick={() => handleEditPartGroupRec(item)}
										variant="ghost"
										size="icon"
										title="Edit"
										class="text-chart-warning hover:text-chart-warning"
										><SquarePenIcon class="size-5!" /></Button
									>
									<EditDeleteBtns id={item.id} actionRoute={'?/deleteGroup'} />
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</article>
	</div>
</main>
