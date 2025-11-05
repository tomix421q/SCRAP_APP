<script lang="ts">
	import { page } from '$app/state';

	let { data }: any = $props();
	// $inspect(page);
</script>

<main class="mx-auto mt-22 lg:mt-77 flex w-full max-w-6xl flex-col items-center justify-center">
	<div class="flex gap-5 flex-col">
		<div class="text-7xl lg:text-[150px] mx-auto text-primary flex items-center">
			<span class="my-auto">{page.status}</span>
		</div>
		<h3 class="text-chart-warning max-w-xl text-center mb-10">{page.error?.message}</h3>
	</div>

	<p class="text-center">
		Sorry, {page.status === 404
			? 'We couldnt find the page you are looking for'
			: 'the page you were looking for encountered an error'}
	</p>
	<div>
		<a href="/" class="text-chart-1 text-xl">
			Go back home <span aria-hidden="true">&rarr;</span>
		</a>
	</div>
</main>
