<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index';

	let { now, triggerClass = '' }: { now: Date; triggerClass?: string } = $props();

	const RECENT_MS = 24 * 60 * 60 * 1000;

	type ChangelogDay = { label: string; entries: ChangelogEntry[] };

	// Commits come newest first from git, so consecutive grouping keeps day order.
	const days: ChangelogDay[] = __APP_CHANGELOG__.reduce<ChangelogDay[]>((acc, entry) => {
		const label = new Date(entry.date).toLocaleDateString('sk-SK', {
			weekday: 'short',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
		const last = acc.at(-1);
		if (last?.label === label) last.entries.push(entry);
		else acc.push({ label, entries: [entry] });
		return acc;
	}, []);

	function isRecent(entry: ChangelogEntry): boolean {
		return now.getTime() - new Date(entry.date).getTime() < RECENT_MS;
	}

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<Dialog.Root>
	<Dialog.Trigger class="px-2 rounded-sm py-0.5 hover:text-primary cursor-pointer {triggerClass}"
		>Changelog</Dialog.Trigger
	>
	<Dialog.Content class="cardNormalize max-h-[85vh] flex flex-col sm:max-w-4xl">
		<Dialog.Header>
			<Dialog.Title class="text-primary">Changelog</Dialog.Title>
			<Dialog.Description>Version {__APP_VERSION__} · last {__APP_CHANGELOG__.length} changes</Dialog.Description>
		</Dialog.Header>

		<div class="overflow-y-auto pr-2 flex flex-col gap-4">
			{#each days as day (day.label)}
				<section>
					<h3 class="text-xs font-semibold text-muted-foreground mb-1 border-b border-border pb-1">
						{day.label}
					</h3>
					<ul class="flex flex-col gap-1">
						{#each day.entries as entry (entry.hash)}
							<li class="flex gap-3 text-xs {isRecent(entry) ? 'text-chart-1' : ''}">
								<span class="text-muted-foreground tabular-nums shrink-0">{formatTime(entry.date)}</span>
								<span>{entry.subject}</span>
							</li>
						{/each}
					</ul>
				</section>
			{:else}
				<p class="text-xs text-muted-foreground">Changelog is not available in this build.</p>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
