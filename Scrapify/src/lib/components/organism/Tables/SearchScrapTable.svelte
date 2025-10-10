<script lang="ts">
	import { Download, SquarePenIcon } from '@lucide/svelte';
	import Button from '../../ui/button/button.svelte';
	import * as Table from '@/components/ui/table';
	import * as HoverCard from '@/components/ui/hover-card/index';
	import { page } from '$app/state';
	import { dateTimmeUTCformatter, isWithinTimeLimit } from '@/index';
	import type { Prisma, User } from '@prisma/client';
	import { authClient } from '@/auth/auth-client';
	import DeleteBtn from '@/components/molecules/DeleteBtn.svelte';
	import { type Role } from '@/utils/types';
	import { editSearchData } from '@/stores/stores';

	export type ScrapRecordWithRelations = Prisma.ScrapRecordGetPayload<{
		include: { part: true; scrapCode: true };
	}>;

	let {
		findRecords,
		totalRecords,
		partsQnt = undefined,
		headerText,
		userInfo
	}: {
		findRecords: ScrapRecordWithRelations[];
		totalRecords?: number;
		partsQnt?: number | null;
		headerText?: string;
		userInfo: User | null;
	} = $props();

	const session = authClient.useSession();
	const userId = $derived($session.data?.user.id);
	let operatorId = $state('');

	function handleEditSearchScrap(item: ScrapRecordWithRelations) {
		editSearchData.set(item);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	$effect(() => {
		let getId = localStorage.getItem('operatorId');
		operatorId = getId ? getId : 'empty';
	});

	// $inspect($editSearchData);
</script>

<main>
	<div class="text-sm my-10 listNormalize">
		<!-- HEADER -->
		<div class="mb-2 gap-x-10 md:flex w-full justify-between">
			<article class="flex text-muted items-center gap-10 tracking-widest font-bold">
				<p>
					<span>Total records: </span><span class="text-chart-3 text-lg"
						>{totalRecords ? totalRecords : '0'}</span
					>
				</p>
				<p class={partsQnt !== undefined ? 'block' : 'hidden'}>
					<span>Quantity: </span><span class="text-chart-3 text-lg"
						>{partsQnt ? partsQnt : '0'}</span
					>
				</p>
			</article>

			<h2 class="lg:text-lg tracking-widest font-bold">{headerText}</h2>

			{#if userId}
				<Button size="sm" variant="outline" href={`/api/export/scrap${page.url.search}`} download>
					<Download class="mr-2 size-4" />
					Export to CSV
				</Button>
			{:else}
				<Button size="sm" variant="outline" href={`/login`}>
					<Download class="mr-2 size-4" />
					Export to CSV
				</Button>
			{/if}
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row class="bg-muted/90">
					<Table.Head class="w-[50px]">ID</Table.Head>
					<Table.Head class="w-[50px]">Scrap Code</Table.Head>
					<Table.Head class="w-[100px]">Scrap Name</Table.Head>
					<Table.Head colspan={1} class="w-[50px]">Part ID</Table.Head>
					<Table.Head class="w-[100px]">Part Number</Table.Head>
					<Table.Head class="w-[100px]">Part Side</Table.Head>
					<Table.Head class="w-[100px]">Processs Name</Table.Head>
					<Table.Head class="w-[50px]">Quantity</Table.Head>
					<Table.Head class="w-[100px]">Scrap description</Table.Head>
					<Table.Head class="w-[100px]">Created by</Table.Head>
					<Table.Head class="w-[100px]">Created At</Table.Head>
					<Table.Head class="w-[60px] text-end">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body class="">
				{#each findRecords as item (item)}
					<Table.Row>
						<Table.Cell class="text-muted">{item.scrapCode.id}</Table.Cell>
						<Table.Cell class="text-primary">{item.scrapCode.code}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.scrapCode.name}</Table.Cell>
						<Table.Cell class="w-[50px]">{item.part.id}</Table.Cell>
						<Table.Cell class="w-[100px] text-primary">{item.part.partNumber}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.part.side ? item.part.side : '?'}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.part.processName}</Table.Cell>
						<Table.Cell class="w-[50px]">{item.quantity}</Table.Cell>
						<Table.Cell class="w-[100px]">{@render description(item.description!)}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.createdBy}</Table.Cell>
						<Table.Cell class="w-[100px] text-xs"
							>{dateTimmeUTCformatter(item.createdAt)}</Table.Cell
						>
						<!-- ACTIONS BTNS  -->
						<Table.Cell>
							<div class="flex justify-end gap-2">
								<section
									class={(userInfo?.role as Role) === 'ADMIN' ||
									(userInfo?.role as Role) === 'MODERATOR' ||
									(userInfo?.role as Role) === 'ENGINEER'
										? 'block'
										: 'hidden'}
								>
									<Button
										onclick={() => handleEditSearchScrap(item)}
										variant="ghost"
										size="icon"
										title="Edit"
										class="text-chart-warning hover:text-chart-warning"
										><SquarePenIcon class="size-5!" /></Button
									>
								</section>
								<section
									class={(operatorId === item.createdBy && isWithinTimeLimit(item.createdAt, 60)) ||
									(userInfo?.role as Role) === 'ADMIN' ||
									(userInfo?.role as Role) === 'MODERATOR' ||
									(userInfo?.role as Role) === 'ENGINEER'
										? 'block'
										: 'hidden'}
								>
									<DeleteBtn id={item.id} actionRoute="?/deleteScrapRecord" />
								</section>
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
