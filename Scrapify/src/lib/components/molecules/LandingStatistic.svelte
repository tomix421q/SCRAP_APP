<script lang="ts">
	import { Loader } from '@lucide/svelte';
	import Card from '../ui/card/card.svelte';
	import CardHeader from '../ui/card/card-header.svelte';
	import CardTitle from '../ui/card/card-title.svelte';
	import CardDescription from '../ui/card/card-description.svelte';
	import { CardContent } from '../ui/card';

	type StatsType = {
		totalScrapPartsLastWeek: Promise<number>;
		totalScrapPartsLast30Days: Promise<number>;
		totalScrapPartsLast1Day: Promise<number>;
	};

	let { stats }: { stats: StatsType } = $props();

	// $inspect(stats);
</script>

<main
	class="flex flex-wrap justify-center gap-4 *:w-full mt-14 lg:*:w-2xs items-center lg:w-4xl mx-auto"
>
	<!-- Last 1 day -->
	<Card class="cardNormalize bg-chart-1/40">
		<CardHeader>
			<CardTitle>Total Records <span class="text-chart-success">[1 day]</span></CardTitle>
			<CardDescription>Recorded scraps for 24 hours.</CardDescription>
		</CardHeader>
		{#await stats.totalScrapPartsLast1Day}
			<p><Loader class="animate-spin mx-auto" /></p>
		{:then totalScrapWeek}
			<CardContent class="text-center text-4xl font-bold text-primary">
				{totalScrapWeek} <span class="text-muted text-sm uppercase">Parts</span>
			</CardContent>
		{:catch error}
			<p class="text-red-500">No Data... {error.message}</p>
		{/await}
	</Card>

	<!-- Last 7 days -->
	<Card class="cardNormalize bg-chart-2/40">
		<CardHeader>
			<CardTitle>Total Records <span class="text-chart-success">[7 days]</span></CardTitle>
			<CardDescription>For last 7 days.</CardDescription>
		</CardHeader>
		{#await stats.totalScrapPartsLastWeek}
			<p><Loader class="animate-spin mx-auto" /></p>
		{:then totalScrapWeek}
			<CardContent class="text-center text-4xl font-bold text-primary">
				{totalScrapWeek} <span class="text-muted text-sm uppercase">Parts</span>
			</CardContent>
		{:catch error}
			<p class="text-red-500">No Data... {error.message}</p>
		{/await}
	</Card>

	<!-- Last 30 days -->
	<Card class="cardNormalize bg-chart-4/40">
		<CardHeader>
			<CardTitle>Total Records <span class="text-chart-success">[30 days]</span></CardTitle>
			<CardDescription>For last 30 days.</CardDescription>
		</CardHeader>
		{#await stats.totalScrapPartsLast30Days}
			<p><Loader class="animate-spin mx-auto" /></p>
		{:then totalScrapWeek}
			<CardContent class="text-center text-4xl font-bold text-primary">
				{totalScrapWeek} <span class="text-muted text-sm uppercase">Parts</span>
			</CardContent>
		{:catch error}
			<p class="text-red-500">No Data... {error.message}</p>
		{/await}
	</Card>
</main>
