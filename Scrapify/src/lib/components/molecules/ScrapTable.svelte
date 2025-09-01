<script lang="ts">
	import { Download } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';
	import * as Table from '@/components/ui/table';
	import * as HoverCard from '@/components/ui/hover-card/index';
	import { page } from '$app/stores';
	import { dateTimmeUTCformatter } from '@/index';
	import type { Prisma, PrismaClient } from '@prisma/client';
	import { authClient } from '@/auth/auth-client';

	export type ScrapRecordWithRelations = Prisma.ScrapRecordGetPayload<{
		include: { part: true; scrapCode: true };
	}>;

	let {
		findRecords,
		totalRecords,
		headerText
	}: {
		findRecords: ScrapRecordWithRelations[];
		totalRecords?: number;
		headerText?: string;
	} = $props();

	const session = authClient.useSession();
	const userId = $derived($session.data?.user.id);

	// $inspect(userId)
</script>

<main>
	<div class="text-sm my-10 listNormalize">
		<div class="mb-2 flex w-full justify-between">
			<p class=" tracking-wide space-x-1">
				<span>Total: </span><span class="font-bold text-chart-3 text-xl"
					>{totalRecords ? totalRecords : '0'}</span
				>
			</p>
			<h2 class="text-lg tracking-widest font-bold">{headerText}</h2>
			{#if userId}
				<Button size="sm" variant="outline" href={`/api/export/scrap${$page.url.search}`} download>
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
					<Table.Head class="w-[100px]">Scrap Code</Table.Head>
					<Table.Head class="w-[100px]">Scrap Name</Table.Head>
					<Table.Head colspan={1} class="w-[50px]">Part ID</Table.Head>
					<Table.Head class="w-[100px]">Part Number</Table.Head>
					<Table.Head class="w-[100px]">Part Color</Table.Head>
					<Table.Head class="w-[100px]">Part Side</Table.Head>
					<Table.Head class="w-[100px]">Processs Name</Table.Head>
					<Table.Head class="w-[50px]">Quantity</Table.Head>
					<Table.Head class="w-[100px]">Scrap description</Table.Head>
					<Table.Head class="w-[100px]">Created by</Table.Head>
					<Table.Head class="w-[100px]">Created At</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body class="">
				{#each findRecords as item (item)}
					{@const createdDate = item.createdAt.toLocaleString()}
					{@const formatCreatedDate = new Intl.DateTimeFormat('sk-Sk', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						timeZone: 'UTC'
					}).format(item.createdAt)}

					<Table.Row>
						<Table.Cell class="w-[100px] text-primary">{item.scrapCode.code}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.scrapCode.name}</Table.Cell>
						<Table.Cell class="w-[50px]">{item.part.id}</Table.Cell>
						<Table.Cell class="w-[100px] text-primary">{item.part.partNumber}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.part.color}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.part.side ? item.part.side : '?'}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.part.processName}</Table.Cell>
						<Table.Cell class="w-[50px]">{item.quantity}</Table.Cell>
						<Table.Cell class="w-[100px]">{@render description(item.description!)}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.createdBy}</Table.Cell>
						<Table.Cell class="w-[100px] text-xs"
							>{dateTimmeUTCformatter(item.createdAt)}</Table.Cell
						>
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
