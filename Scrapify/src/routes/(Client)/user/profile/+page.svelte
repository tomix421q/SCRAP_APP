<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import type { PageProps } from './$types';
	import Card from '@/components/ui/card/card.svelte';
	import CardHeader from '@/components/ui/card/card-header.svelte';
	import CardTitle from '@/components/ui/card/card-title.svelte';
	import CardDescription from '@/components/ui/card/card-description.svelte';
	import CardContent from '@/components/ui/card/card-content.svelte';
	import { dateTimmeUTCformatter } from '@/index';

	let { data }: PageProps = $props();
	let user = $derived(data.user);

	// $inspect(user);
</script>

<ToNavigateBtn href="/" text="Home" />
<main>
	<div class="grid lg:grid-cols-3 gap-10">
		<Card class="cardNormalize bg-primary/10">
			<CardHeader>
				<CardTitle
					class="text-3xl font-bold tracking-widest bg-gradient-to-r from-chart-1 to-chart-3 bg-clip-text text-transparent"
					>User Info</CardTitle
				>
				<CardDescription>Info about user: {user?.id}</CardDescription>
			</CardHeader>
			<CardContent class="text-lg text-muted font-semibold">
				<div class="">
					<span class="">Name :</span> <span class="text-primary"> {user?.name}</span>
				</div>
				<div><span>Card ID :</span> <span class="text-primary">{user?.cardId}</span></div>

				<div>
					<span>Email Verify :</span> <span class="text-primary">{user?.emailVerified}</span>
				</div>
				<div>
					<span>Role :</span> <span class="text-primary">{user?.role}</span>
				</div>
				<div>
					<span>Created At :</span>
					<span class="text-primary">{dateTimmeUTCformatter(user!.createdAt)}</span>
				</div>
			</CardContent>
		</Card>
	</div>
</main>
