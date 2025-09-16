<script lang="ts">
	import * as Table from '@/components/ui/table';
	import * as HoverCard from '@/components/ui/hover-card/index';
	import type { Part, Prisma, Process } from '@prisma/client';
	import { authClient } from '@/auth/auth-client';
	import EditDeleteBtns from '../../molecules/DeleteBtn.svelte';

	export type ProcessWithRelations = Prisma.ProcessGetPayload<{
		include: { project: true; parts: true };
	}>;

	let {
		processes,
		headerText,
		processCount
	}: {
		processes: ProcessWithRelations[];
		totalPages?: number;
		processCount?: number;
		headerText?: string;
	} = $props();

	const session = authClient.useSession();
	const userId = $derived($session.data?.user.id);

	// $inspect(processes);
</script>

<main>
	<div class="text-sm my-10 listNormalize">
		<div class="mb-2 space-y-2 md:flex w-full justify-between">
			<p class=" tracking-widest space-x-1">
				<span>Total: </span><span class="font-bold text-chart-3 text-xl"
					>{processCount ? processCount : '0'}</span
				>
			</p>
			<h2 class="lg:text-lg tracking-widest font-bold">{headerText}</h2>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row class="bg-chart-4/40 *:text-chart-1">
					<Table.Head class="w-[100px]">ID</Table.Head>
					<Table.Head class="w-[100px]">Name</Table.Head>
					<Table.Head class="w-[100px]">Project ID</Table.Head>
					<Table.Head class="w-[100px]">Description</Table.Head>
					<Table.Head class="w-[100px]">Parts</Table.Head>

					<Table.Head colspan={1} class="text-end">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body class="">
				{#each processes as item (item)}
					<!-- {@const createdDate = item.createdAt.toLocaleString()} -->
					<!-- {@const formatCreatedDate = new Intl.DateTimeFormat('sk-Sk', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						timeZone: 'UTC'
					}).format(item.createdAt)} -->

					<Table.Row>
						<Table.Cell class="w-[100px]">{item.id}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.name}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.projectId}</Table.Cell>
						<Table.Cell class="w-[100px]">{@render description(item.description!)}</Table.Cell>

						<Table.Cell class="w-[100px]">{@render partsArr(item.parts!)}</Table.Cell>
						<Table.Cell class="w-[50px]"
							><EditDeleteBtns id={item.id} actionRoute={'?/deleteProcess'} /></Table.Cell
						>
						<!-- <Table.Cell class="w-[100px] text-primary">{item.part.partNumber}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.part.color}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.part.side ? item.part.side : '?'}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.part.processName}</Table.Cell>
						<Table.Cell class="w-[50px]">{item.quantity}</Table.Cell>
						<Table.Cell class="w-[100px]">{item.createdBy}</Table.Cell>
						<Table.Cell class="w-[100px] text-xs"
							>{dateTimmeUTCformatter(item.createdAt)}</Table.Cell
						> -->
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

{#snippet partsArr(arr: Part[])}
	{#if arr.length === 0}
		<p class="text-muted">X</p>
	{:else}
		<HoverCard.Root>
			<HoverCard.Trigger>{arr.length > 0 ? 'Check' : 'X'}</HoverCard.Trigger>
			<HoverCard.Content class="">
				<ul class="overflow-auto scroll-auto max-h-[900px] text-sm">
					{#each arr as part}
						<div class="flex flex-col mb-2 border-b">
							<p>Part Id :<span class="text-primary mx-1 font-semibold">{part.id}</span></p>
							<p>Hall Name :<span class="text-primary mx-1 font-semibold">{part.hallName}</span></p>
							<p>Part Number :<span class="text-primary mx-1 font-semibold">{part.partNumber}</span></p>
							<p>Process Id :<span class="text-primary mx-1 font-semibold">{part.processId}</span></p>
							<p>Process name : <span class="text-primary mx-1 font-semibold"> {part.processName}</span></p>
							<p>Side? : <span class="text-primary mx-1 font-semibold">{part.side}</span></p>
						</div>
					{/each}
				</ul>
			</HoverCard.Content>
		</HoverCard.Root>
	{/if}
{/snippet}
