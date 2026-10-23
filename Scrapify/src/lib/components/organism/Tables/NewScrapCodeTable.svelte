<script lang="ts">
	import * as Table from '@/components/ui/table';
	import type { vScrapCodes } from '@prisma/client';

	let {
		scrapCodes,
		headerText,
		scrapCodeCount
	}: {
		scrapCodes: vScrapCodes[];
		scrapCodeCount?: number;
		headerText?: string;
	} = $props();
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
		<Table.Root class="lg:table-fixed w-full ">
			<Table.Header>
				<Table.Row class="bg-chart-4/40 *:text-chart-1 *:border">
					<Table.Head class="w-15">Code</Table.Head>
					<Table.Head class="w-15">Process ident.</Table.Head>
					<Table.Head class="w-30">Description</Table.Head>
					<Table.Head class="w-30">Project</Table.Head>
					<Table.Head class="w-30">Process</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body class="">
				{#each scrapCodes as item, index (index)}
					<Table.Row class="*:border *:truncate">
						<Table.Cell class="">{item.Reason_Code}</Table.Cell>
						<Table.Cell class="">{item.Reason_Code_ProcessIdent}</Table.Cell>
						<Table.Cell class="" title={item.Reason_Description}
							>{item.Reason_Description}</Table.Cell
						>
						<Table.Cell title={item.Reason_Project}>{item.Reason_Project}</Table.Cell>

						<Table.Cell title={item.Reason_Process_EN}>{item.Reason_Process_EN}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>
