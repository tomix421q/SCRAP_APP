<script lang="ts">
	import * as Table from '@/components/ui/table';
	import * as HoverCard from '@/components/ui/hover-card/index';
	import { authClient } from '@/auth/auth-client';
	import EditDeleteBtns from '../../molecules/DeleteBtn.svelte';
	import { editScrapData } from '@/stores/stores';
	import Button from '@/components/ui/button/button.svelte';
	import { SquarePenIcon } from '@lucide/svelte';
	import type { Process, ScrapCode } from '../../../../../prisma/generated/client/client';

	let {
		scrapCodes,
		headerText,
		scrapCodeCount,
		processes
	}: {
		scrapCodes: ScrapCode[];
		totalPages?: number;
		scrapCodeCount?: number;
		headerText?: string;
		processes: Process[];
	} = $props();

	const session = authClient.useSession();
	const userId = $derived($session.data?.user.id);

	function handleEditScrapRec(item: ScrapCode) {
		editScrapData.set(item);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// $inspect(processes);
</script>

<main>
	<div class="text-sm my-10 listNormalize">
		<div class="mb-2 space-y-2 md:flex w-full justify-between">
			<p class=" tracking-widest space-x-1">
				<span>Total: </span><span class="font-bold text-chart-3 text-xl"
					>{scrapCodeCount ? scrapCodeCount : '0'}</span
				>
			</p>
			<h2 class="lg:text-lg tracking-widest font-bold">{headerText}</h2>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row class="bg-chart-4/40 *:text-chart-1">
					<Table.Head class="w-[40px]">ID</Table.Head>
					<Table.Head class="w-[40px]">Active?</Table.Head>
					<Table.Head class="w-[50px]">Code</Table.Head>
					<Table.Head class="w-[200px]">Name</Table.Head>
					<Table.Head class="w-[200px]">Process ID</Table.Head>
					<Table.Head class="w-[100px]">Description</Table.Head>

					<Table.Head colspan={1} class="text-end">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body class="">
				{#each scrapCodes as item (item)}
					<Table.Row>
						<Table.Cell class="w-[40px]">{item.id}</Table.Cell>
						<Table.Cell class="w-[40px]">{item.active}</Table.Cell>
						<Table.Cell class="w-[50px]">{item.code}</Table.Cell>
						<Table.Cell class="w-[200px]">{@render description(item.name!)}</Table.Cell>
						<Table.Cell class="w-[200px]"
							>{item.processId}-
							{processes.find((process) => process.id === item.processId)?.name ??
								`Process with id-${item.processId} was deleted,append process or delete it.`}</Table.Cell
						>
						<Table.Cell class="w-[100px]">{@render description(item.description!)}</Table.Cell>
						<!-- ACTIONS BTNS -->
						<Table.Cell class="w-[50px]">
							<div class="flex justify-end gap-2">
								<Button
									onclick={() => handleEditScrapRec(item)}
									variant="ghost"
									size="icon"
									title="Edit"
									class="text-chart-warning hover:text-chart-warning"
									><SquarePenIcon class="size-5!" /></Button
								>
								<EditDeleteBtns id={item.id} actionRoute={'?/deleteScrapCode'} />
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
