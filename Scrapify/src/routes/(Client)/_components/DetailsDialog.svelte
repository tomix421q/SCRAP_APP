<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronRight } from '@lucide/svelte';
	import * as Dialog from '@/components/ui/dialog';
	import Button from '@/components/ui/button/button.svelte';

	type Props = {
		title: string;
		/** Active period and project the detail is about. */
		description: string;
		/** `/scrapRecords` query string with the same period and project. */
		scrapRecordsQuery: string;
		children: Snippet;
	};

	let { title, description, scrapRecordsQuery, children }: Props = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger
		class="inline-flex items-center text-sm text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
	>
		Details <ChevronRight class="size-4" aria-hidden="true" />
	</Dialog.Trigger>
	<Dialog.Content class="max-h-[90dvh] gap-3 overflow-y-auto sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>{description}</Dialog.Description>
		</Dialog.Header>
		{@render children()}
		<Dialog.Footer>
			<Button href="/scrapRecords?{scrapRecordsQuery}" variant="outline">
				Open in scrap records
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
