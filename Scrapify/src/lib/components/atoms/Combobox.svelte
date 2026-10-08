<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import Button from '@/components/ui/button/button.svelte';
	import { CheckIcon, ChevronsUpDownIcon } from '@lucide/svelte';
	import { cn } from '@/components/ui/utils';
	import { tick } from 'svelte';
	import { isEditing } from '@/stores/stores';

	type NameLabel = 'name' | 'codeName' | 'partnumSideColor' | 'nameAndHall';

	let {
		dataBox = [],
		value = $bindable(),
		reset = $bindable(false),
		id = '',
		nameLabel = 'name',
		width = 'sm',
		firstText = 'Select item',
		onchange
	}: {
		dataBox: any[];
		value?: string;
		reset?: boolean;
		id?: string;
		nameLabel?: NameLabel;
		width?: 'sm' | 'lg';
		firstText?: string;
		onchange?: (val: string) => void;
	} = $props();

	let open = $state(false);
	let editMode = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	// LABEL TEXT
	const selectedLabel = $derived.by<string | undefined>(() => {
		if (!value) return undefined;
		const foundItem = dataBox?.find(
			(f: { id: number | string }) => f.id.toString() === value!.toString()
		);
		if (!foundItem) return undefined;

		if (foundItem.name && foundItem.project?.hall) {
			return `${foundItem.name} - ${foundItem.hall.name}`;
		}
		if (foundItem.name && foundItem.code) {
			return `${foundItem.code} - ${foundItem.name}`;
		}
		if (foundItem.partNumber) {
			return `${foundItem.partNumber} - ${foundItem.side}`;
		}
		if (foundItem.name) {
			return foundItem.name;
		}
		return undefined;
	});

	let changeCss = $derived<boolean>(!!selectedLabel && selectedLabel.length > 35);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}

	// SEARCH
	function getItemSearchText(item: any): string {
		if (item.code && item.name) return `${item.code} ${item.name}`;
		if (item.partNumber) return `${item.partNumber} ${item.side ?? ''}`;
		return String(item.name ?? item.id);
	}

	// RESET
	$effect(() => {
		if (reset) {
			value = '';
			onchange?.('');
			reset = false;
		}

		if ($isEditing && !editMode) {
			editMode = true;
			value = '';
			onchange?.('');
		}

		if (!$isEditing) {
			editMode = false;
		}
	});
</script>

<div class="max-sm:w-full">
	<Popover.Root bind:open>
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				<Button
					{...props}
					{id}
					variant="secondary"
					role="combobox"
					aria-expanded={open}
					class="max-sm:w-full  text-md justify-between whitespace-break-spaces {changeCss &&
						'lg:text-sm'} {width === 'sm' ? 'w-[370px]' : 'w-[430px]'}"
				>
					{selectedLabel || firstText}
					<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>

		<Popover.Content
			class="max-sm:w-full {width === 'sm' ? 'w-[370px]' : 'w-[430px]'} p-0 border-primary"
		>
			<Command.Root>
				<Command.Input placeholder="Search ..." class="h-4! inputNormalize" />

				<Command.List class="mt-2">
					<Command.Empty>Empty</Command.Empty>
					<Command.Group>
						{#each dataBox as item (item.id)}
							<Command.Item
								class="hover:bg-primary/20!"
								value={getItemSearchText(item)}
								onSelect={() => {
									const selectedId = item.id.toString();
									value = selectedId;
									onchange?.(selectedId);
									closeAndFocusTrigger();
								}}
							>
								<CheckIcon
									class={cn(
										'mr-2 size-4',
										value === item.id.toString() ? 'text-chart-success' : 'text-transparent'
									)}
								/>
								<div class="cursor-pointer min-w-full">
									{@render labelText(item)}
								</div>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>

{#snippet labelText(item: any)}
	{#if nameLabel === 'name'}
		<span>{item.name}</span>
	{:else if nameLabel === 'codeName'}
		<span>{item.code + ' - ' + item.name}</span>
	{:else if nameLabel === 'partnumSideColor'}
		<span>{item.partNumber + ' - ' + item.side}</span>
	{:else if nameLabel === 'nameAndHall'}
		<span>{item.name + ' - ' + item.hall.name}</span>
	{/if}
{/snippet}
