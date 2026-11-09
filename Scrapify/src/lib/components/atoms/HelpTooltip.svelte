<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CircleHelp } from '@lucide/svelte';
	import * as Tooltip from '@/components/ui/tooltip';
	import { cn } from '@/components/ui/utils';

	let {
		label,
		children,
		class: className,
		contentClass
	}: {
		/** Accessible name of the "?" button. */
		label: string;
		/** Tooltip body. */
		children: Snippet;
		/** Extra classes for the "?" button. */
		class?: string;
		/** Extra classes for the tooltip panel. */
		contentClass?: string;
	} = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger
			type="button"
			class={cn('text-muted-foreground hover:text-foreground', className)}
			aria-label={label}
		>
			<CircleHelp class="size-5" />
		</Tooltip.Trigger>
		<Tooltip.Content class={cn('max-w-sm text-left bg-background p-1', contentClass)}>
			{@render children()}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
