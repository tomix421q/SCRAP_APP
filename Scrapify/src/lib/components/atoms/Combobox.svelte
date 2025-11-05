<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import Button from '@/components/ui/button/button.svelte';
	import { CheckIcon, ChevronsUpDownIcon } from '@lucide/svelte';
	import { cn } from '@/components/ui/utils';
	import { tick } from 'svelte';
	import { isEditing } from '@/stores/stores';

	// global store is $isEditing - state for editing something

	type NameLabel = 'name' | 'codeName' | 'partnumSideColor' | 'nameAndHall';

	let {
		dataBox,
		value = $bindable(),
		reset = $bindable(),
		id = '',
		nameLabel = 'name'
	}: {
		dataBox: any[];
		value: string;
		reset: boolean;
		id?: string;
		nameLabel?: NameLabel;
	} = $props();
	let open = $state(false);
	let InternalValue = $derived(String(value));
	let editMode = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	// const selectedLabel = $derived(dataBox?.find((f: any) => f.id === InternalValue)?.name);
	const selectedLabel = $derived.by<string | undefined>(() => {
		const foundItem = dataBox?.find((f: { id: number }) => f.id.toString() === InternalValue);
		if (!foundItem) {
			return undefined;
		}

		// extra info for page createScrap (Process filter)
		if (foundItem.name && foundItem.project?.hall) {
			let name = foundItem.name + ' - ' + foundItem.hall.name;
			return name;
		}
		if (foundItem.name && foundItem.code) {
			let name = foundItem.code + ' - ' + foundItem.name;
			return name;
		}
		if (foundItem.partNumber) {
			let name = foundItem.partNumber + ' - ' + foundItem.side;
			return name;
		}
		if (foundItem.name) {
			let name = foundItem.name;
			return name;
		}

		return undefined;
	});
	let changeCss = $derived<boolean>(selectedLabel && selectedLabel?.length > 25 ? true : false);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			if (triggerRef) {
				triggerRef.focus();
			}
		});
	}

	$effect(() => {
		if (InternalValue && !reset) {
			value = InternalValue;
		}
		if (reset) {
			InternalValue = '';
			value = '';
			reset = false;
		}
		if ($isEditing && editMode === false) {
			editMode = true;
			InternalValue = '';
		}
		if ($isEditing === false) editMode = false;
	});

	// testing [create process]
	$effect(() => {
		InternalValue = value;
	});

	// $inspect(InternalValue);
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
					class="w-full lg:w-[370px] text-md justify-between whitespace-break-spaces {changeCss &&
						'lg:h-[50px]'}"
				>
					{selectedLabel || 'Select item'}
					<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-full lg:w-[370px] p-0 border-primary">
			<Command.Root>
				<Command.Input placeholder="Search ..." class="h-4! inputNormalize" />

				<Command.List class="mt-2">
					<Command.Empty>Empty</Command.Empty>
					<Command.Group>
						{#each dataBox as item}
							<Command.Item
								class="hover:bg-primary/20!"
								value={selectedLabel}
								onSelect={() => {
									InternalValue = item.id.toString();
									closeAndFocusTrigger();
								}}
							>
								<CheckIcon
									class={cn(
										'mr-2 size-4',
										InternalValue == item.id ? 'text-chart-success' : 'text-transparent'
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
