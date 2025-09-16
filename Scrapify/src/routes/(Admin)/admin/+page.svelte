<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
</script>

<main>
	<h1 class="text-4xl mb-8 lg:text-6xl uppercase font-bold text-primary tracking-wide">
		Admin Dashboard
	</h1>

	<div class="flex flex-col lg:flex-row lg:flex-wrap gap-18 lg:gap-8">
		<!-- Create zone -->
		<div class=" listNormalize w-full lg:w-[30%]">
			<h1 class="text-2xl mb-2 lg:text-4xl bg-primary/30 p-2 rounded-2xl">Create zone</h1>

			<section class="flex flex-col gap-4 mt-10">
				<Button variant="secondary" href="/admin/newscrapcode" size="lg" class="ring-chart-1 ring-2"
					>Scrap code</Button
				>
				<Button href="/admin/newpart" variant="secondary" size="lg" class="ring-chart-2 ring-2"
					>Part</Button
				>
				<Button href="/admin/newprocess" variant="secondary" size="lg" class="ring-chart-2 ring-2"
					>Process</Button
				>
				<Button href="/admin/newproject" variant="secondary" size="lg" class="ring-chart-2 ring-2"
					>Project</Button
				>
				<Button href="/admin/newhall" variant="secondary" size="lg" class="ring-chart-2 ring-2"
					>Hall</Button
				>
			</section>
		</div>

		<!-- User zone -->
		<div class=" w-full listNormalize lg:w-[30%]">
			<h1 class="text-2xl lg:text-4xl mb-2 bg-primary/30 p-2 rounded-2xl">User zone</h1>

			<section class="flex flex-col gap-4 mt-10">
				<Button variant="secondary" class="ring-chart-2 ring-2" href="/admin/users">Users</Button>
			</section>
		</div>

		<!-- Log zone -->
		<div class="lg:mb-32 listNormalize w-full">
			<h1 class="text-2xl lg:text-4xl mb-2 bg-primary/30 p-2 rounded-2xl">User activity logger:</h1>

			<section class="flex flex-col lg:flex-row gap-4 mt-10">
				<span>Soon...</span>
			</section>
		</div>
	</div>
</main>
