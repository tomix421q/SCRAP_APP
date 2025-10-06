<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import Card from '@/components/ui/card/card.svelte';
	import type { LayoutProps, PageProps } from './$types';
	import { ChartColumnBigIcon, Hash, PartyPopperIcon, Puzzle } from '@lucide/svelte';
	import Logger from '@/components/organism/Logger.svelte';

	let { data }: PageProps = $props();
	let { totalUsers, totalScrapCode, totalParts } = $derived(data);

	// $inspect(data.totalUsers);
</script>

<main>
	<Card
		class="text-4xl mb-8 lg:text-6xl uppercase font-bold text-primary tracking-wide cardNormalize bg-chart-2/10 min-w-full"
	>
		<CardHeader>
			<CardTitle>Admin Dashboard</CardTitle>
		</CardHeader>
	</Card>

	<div class="grid lg:grid-cols-2 items-start gap-12 lg:gap-6">
		<!-- Create zone -->
		<Card class="cardNormalize bg-chart-2/10 min-w-full">
			<CardHeader>
				<CardTitle
					class="text-3xl font-bold tracking-widest bg-gradient-to-r from-chart-1 to-chart-3 bg-clip-text text-transparent"
					>Create zone</CardTitle
				>
				<CardDescription>Create zone</CardDescription>
			</CardHeader>

			<CardContent class="grid grid-cols-2 gap-4 text-3xl">
				<div class="flex flex-col gap-4">
					<Button variant="destructive" href="/admin/newscrapcode" size="lg">Scrap code</Button>
					<Button href="/admin/newpart" variant="default" size="lg">Part</Button>
					<Button href="/admin/newprocess" variant="secondary" size="lg">Process</Button>
					<Button href="/admin/newproject" variant="secondary" size="lg">Project</Button>
					<Button href="/admin/newhall" variant="secondary" size="lg">Hall</Button>
				</div>
				<div class="mx-auto space-y-2">
					<section class="mx-auto flex items-center">
						<Hash class="size-22 text-primary/50" />
						<div class="flex flex-col items-center w-full">
							<span class="text-2xl">Scrap codes</span>
							<span class="text-primary font-bold text-4xl">{totalScrapCode}</span>
						</div>
					</section>
					<section class="mx-auto flex items-center">
						<Puzzle class="size-22 text-primary/50" />
						<div class="flex flex-col items-center w-full">
							<span class="text-2xl">Parts</span>
							<span class="text-primary font-bold text-4xl">{totalParts}</span>
						</div>
					</section>
				</div>
			</CardContent>
		</Card>

		<!-- User zone -->
		<Card class="cardNormalize bg-chart-2/10 min-w-full!">
			<CardHeader>
				<CardTitle
					class="text-3xl font-bold tracking-widest bg-gradient-to-r from-chart-1 to-chart-3 bg-clip-text text-transparent"
					>User zone</CardTitle
				>
				<CardDescription>Info about user roles and register operator card ID</CardDescription>
			</CardHeader>

			<CardContent class="grid grid-cols-2 gap-4 text-3xl">
				<div class="flex flex-col gap-4">
					<Button size="lg" href="/admin/users">Users</Button>
					<Button size="lg" href="/admin/users">Register operator</Button>
				</div>
				<div class="mx-auto space-y-2">
					<section class="mx-auto flex items-center">
						<ChartColumnBigIcon class="size-22 text-primary/50" />
						<div class="flex flex-col items-center w-full">
							<span class="text-2xl">Users</span>
							<span class="text-primary font-bold text-4xl">{totalUsers}</span>
						</div>
					</section>
					<section class="mx-auto flex items-center">
						<ChartColumnBigIcon class="size-22 text-primary/50" />
						<div class="flex flex-col items-center w-full">
							<span class="text-2xl">Operators</span>
							<span class="text-primary font-bold text-4xl">{totalUsers}</span>
						</div>
					</section>
				</div>
			</CardContent>
		</Card>

		<!-- Log zone -->
		<Card class="cardNormalize bg-chart-2/10 lg:col-span-3 min-w-full">
			<CardHeader>
				<CardTitle
					class="text-3xl font-bold tracking-widest bg-gradient-to-r from-chart-1 to-chart-3 bg-clip-text text-transparent"
				>
					Activity
				</CardTitle>

				<CardDescription>User activity logger</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<span><Logger data={totalParts} /></span>
			</CardContent>
		</Card>
	</div>
</main>
