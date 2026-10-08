<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import type { ActionData } from '../$types';
	import { Lock, X } from '@lucide/svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Separator from '@/components/ui/separator/separator.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import { slide } from 'svelte/transition';

	type ScanSuccess = Extract<ActionData, { data: any }>;
	type MatchData = NonNullable<ScanSuccess['data']>['match'];

	let {
		scanData,
		scrapCodesRecord = $bindable(),
		checkBoxes = $bindable(),
		otherVariantPN = $bindable(),
		selectScrapForGroup,
		hasAnySelection
	}: {
		scanData: MatchData | undefined;
		scrapCodesRecord: Record<string, string>;
		checkBoxes: Record<string, boolean>;
		otherVariantPN: Record<string, string>;
		selectScrapForGroup: (gName: string, selectId: string) => void;
		hasAnySelection: boolean;
	} = $props();

	$effect(() => {
		scanData?.groups.map((g) => {
			if (g.name && g.isRebuild) {
				checkBoxes[g.name] = false;
			}
		});
	});

	// $inspect(scrapCodesRecord);
</script>

{#if scanData?.groups}
	<h2 class="text-3xl font-bold text-chart-1 text-center">Zvol dovod rebuildu</h2>
	{#each scanData.groups as group}
		<!--  -->
		<!-- IS REBUILD? ... -->

		{#if group.isRebuild}
			<article class="flex justify-between items-center flex-col sm:flex-row border-b-2 pb-3">
				<p class="text-xl font-semibold relative">
					{group.name}
					<span class="text-xs absolute text-chart-3 w-max ml-1 -top-0 bg-black px-3 rounded-lg"
						>Big</span
					>
				</p>

				<!-- {@const availableScrapCodes = scrapCodes.filter((c) => c.name.includes(group.name))} -->
				<div class="flex gap-2 justify-between items-center">
					<Button
						title="Remove item"
						size="icon"
						variant="ghost"
						class={scrapCodesRecord[group.name]?.length > 0
							? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
							: 'hidden'}
						onclick={() => {
							scrapCodesRecord[group.name] = '';
							otherVariantPN = {};
							checkBoxes = {};
							scrapCodesRecord = {};
						}}><X /></Button
					>
					{#if !checkBoxes[group.name]}
						<div class="flex flex-col gap-1">
							<Combobox
								dataBox={group.scrapCodes}
								nameLabel="codeName"
								id="dmcScrapCode"
								width="lg"
								firstText="Vyber dovod scrapu"
								bind:value={scrapCodesRecord[group.name]}
								onchange={(selectedId) => selectScrapForGroup(group.name, selectedId)}
							/>
							{#if otherVariantPN[group.name]}
								<Combobox
									dataBox={group.parts}
									nameLabel="partnumSideColor"
									id="partNumber"
									width="lg"
									firstText="Vyber cislo partu"
									bind:value={otherVariantPN[group.name]}
								/>
							{/if}
						</div>
					{:else}
						<article
							class="h-9 my-auto w-[430px] justify-between flex items-center border-chart-1 border-2 px-2 bg-secondary rounded-lg"
						>
							<p>Iny komponent</p>
							<Lock class="stroke-primary stroke-3 size-5" />
						</article>
					{/if}

					<div class="flex items-center gap-2 ">
						<Label for={`other-${group.name}`} class="w-[80px] text-center">Iny komponent</Label>
						<Checkbox
							id={`other-${group.name}`}
							class="size-5! ring-2 ring-primary **:size-5"
							checked={checkBoxes[group.name] === true}
							onCheckedChange={(val: any) => {
								if (val) {
									scrapCodesRecord[group.name] = '';
									checkBoxes[group.name] = true;
									console.log('bum');
								} else {
									checkBoxes[group.name] = false;
								}
							}}
						/>
					</div>
				</div>
			</article>
		{/if}

		<!--  -->
		<!-- IS ANY SELECTION? AND NO REBUILD FLAG ... -->
		{#if hasAnySelection && !group.isRebuild}
			<article class="flex justify-between items-center flex-col sm:flex-row">
				<p class="text-xl font-semibold relative">
					{group.name}
					<span class="text-xs absolute text-chart-2 w-max ml-1 -top-0 bg-black px-3 rounded-lg"
						>Small</span
					>
				</p>

				<!-- {@const availableScrapCodes = scrapCodes.filter((c) => c.name.includes(group.name))} -->
				<div class="flex gap-2 justify-between items-center">
					<Button
						title="Remove item"
						size="icon"
						variant="ghost"
						class={scrapCodesRecord[group.name]?.length > 0
							? 'flex text-destructive bg-destructive/10 hover:bg-destructive/50'
							: 'hidden'}
						onclick={() => {
							scrapCodesRecord[group.name] = '';
						}}><X /></Button
					>
					<div class="flex flex-col gap-1">
						<Combobox
							dataBox={group.scrapCodes}
							nameLabel="codeName"
							id="dmcScrapCode"
							width="lg"
							firstText="Vyber dovod scrapu"
							bind:value={scrapCodesRecord[group.name]}
							onchange={(selectedId) => selectScrapForGroup(group.name, selectedId)}
							reset
						/>
						{#if otherVariantPN[group.name]}
							<Combobox
								dataBox={group.parts}
								nameLabel="partnumSideColor"
								id="partNumber"
								width="lg"
								firstText="Vyber part"
								bind:value={otherVariantPN[group.name]}
							/>
						{/if}
					</div>

					<div class="flex items-center gap-2 w-[105px]">
						<!-- <Label for={`other-${group.name}`} class="w-[80px] text-center">Iny komponent</Label>
						<Checkbox
							id={`other-${group.name}`}
							class="size-5! ring-2 ring-primary **:size-5"
							checked={checkBoxes[group.name] === true}
							onCheckedChange={(val: any) => {
								if (val) {
									scrapCodesRecord[group.name] = '';
									checkBoxes[group.name] = true;
									console.log('bum');
								} else {
									checkBoxes[group.name] = false;
								}
							}}
						/> -->
					</div>
				</div>
			</article>
		{/if}
	{/each}
{/if}
