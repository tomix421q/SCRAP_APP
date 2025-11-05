<script lang="ts">
	import * as Table from '@/components/ui/table';
	import * as HoverCard from '@/components/ui/hover-card/index';
	import type { Part } from '@prisma/client';
	import { authClient } from '@/auth/auth-client';
	import EditDeleteBtns from '../../molecules/DeleteBtn.svelte';
	import { editPartData } from '@/stores/stores';
	import Button from '@/components/ui/button/button.svelte';
	import { SquarePenIcon } from '@lucide/svelte';
	import type { PartWithRelation } from '@/utils/types';

	let {
		parts,
		headerText,
		totalPages,
		partsCount
	}: {
		parts: PartWithRelation[];
		totalPages?: number;
		partsCount?: number;
		headerText?: string;
	} = $props();

	const session = authClient.useSession();
	const userId = $derived($session.data?.user.id);

	function handleEditPartRec(item: Part) {
		editPartData.set(item);
		window.scrollTo({ top: 0, behavior: 'instant' });
	}

	// $inspect(parts)
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
					<Table.Head class="w-[100px]">ID</Table.Head>
					<Table.Head class="w-[100px]">Part Number</Table.Head>
					<Table.Head class="w-[100px]">Process</Table.Head>
					<Table.Head class="w-[100px]">Project</Table.Head>
					<Table.Head class="w-[100px]">Hall</Table.Head>
					<Table.Head class="w-[100px]">Side?</Table.Head>
					<Table.Head colspan={1} class="text-end">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each parts as item (item)}
					<Table.Row>
						<Table.Cell class="w-[100px]">{item.id}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.partNumber}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.process.name}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.project.name}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.process.hall.name}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.side}</Table.Cell>

						<Table.Cell class="w-[50px]">
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
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>

{#snippet description(desc: string)}
	{#if desc.length === 0}
		<p class="text-muted-foreground">X</p>
	{:else}
		<HoverCard.Root>
			<HoverCard.Trigger>{desc.length > 15 ? desc?.slice(0, 15) + '...' : desc}</HoverCard.Trigger>
			<HoverCard.Content>{desc}</HoverCard.Content>
		</HoverCard.Root>
	{/if}
{/snippet}
