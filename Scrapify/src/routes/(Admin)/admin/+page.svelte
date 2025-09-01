<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { Separator } from '@/components/ui/separator';
	import { User } from '@lucide/svelte';
</script>

<main>
	<h1 class="text-2xl mb-8 lg:text-5xl">Admin Dashboard</h1>

	<section class="flex flex-col lg:flex-row gap-2">
		<Button href="/admin/newpart">Create new part</Button>
		<Button href="/admin/newprocess">Create new process</Button>
		<Button href="/admin/newproject">Create new project</Button>
		<Button href="/admin/newhall">Create new hall</Button>
		<Button variant="destructive" href="/admin/newscrapcode">Create scrap code</Button>
	</section>

	<!--  -->
	<Separator class="inline-block my-10" />
	<Button variant="secondary" size="lg" href="/admin/users" class="w-full"><User /> Users</Button>
</main>
