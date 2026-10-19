<script lang="ts">
	import * as Table from '@/components/ui/table';
	import * as HoverCard from '@/components/ui/hover-card/index';
	import { authClient } from '@/auth/auth-client';
	import EditDeleteBtns from '../../molecules/DeleteBtn.svelte';
	import { editScrapData } from '@/stores/stores';
	import Button from '@/components/ui/button/button.svelte';
	import { SquarePenIcon } from '@lucide/svelte';
	import type { ScrapCode } from '@prisma/client';

	let {
		scrapCodes,
		headerText,
		scrapCodeCount,
		vProjects
	}: {
		scrapCodes: ScrapCode[];
		totalPages?: number;
		scrapCodeCount?: number;
		headerText?: string;
		vProjects: string[];
	} = $props();

	const session = authClient.useSession();
	const userId = $derived($session.data?.user.id);

	function handleEditScrapRec(item: ScrapCode) {
		editScrapData.set(item);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// $inspect(scrapCodes);
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
		<Table.Root class="table-fixed w-full ">
			<Table.Header>
				<Table.Row class="bg-chart-4/40 *:text-chart-1 *:border">
					<Table.Head class="w-20">ID</Table.Head>

					<Table.Head class="w-60">Code</Table.Head>
					<Table.Head class="w-60">Name</Table.Head>
					<Table.Head class="w-30">Project</Table.Head>
					<Table.Head class="w-30">Active?</Table.Head>
					<Table.Head class="w-120">Description</Table.Head>

					<Table.Head colspan={1} class="text-end">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body class="">
				{#each scrapCodes as item (item)}
					<Table.Row class="*:border *:truncate">
						<Table.Cell class="">{item.id}</Table.Cell>

						<Table.Cell class="">{item.code}</Table.Cell>
						<Table.Cell class="">{item.vProject}</Table.Cell>
						<Table.Cell class="">{@render description(item.name!)}</Table.Cell>
						<Table.Cell class="">{item.active}</Table.Cell>
						<Table.Cell class="" title={item.description}
							>{@render description(item.description!)}</Table.Cell
						>

						<!-- ACTIONS BTNS -->
						<Table.Cell class="">
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
		<p class="text-muted-foreground"></p>
	{:else}
		<HoverCard.Root>
			<HoverCard.Trigger>{desc.length > 15 ? desc?.slice(0, 15) + '...' : desc}</HoverCard.Trigger>
			<HoverCard.Content>{desc}</HoverCard.Content>
		</HoverCard.Root>
	{/if}
{/snippet}
