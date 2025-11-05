<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';

	let { totalPages }: { totalPages: number } = $props();

	const currentPage = $derived(Number($page.url.searchParams.get('page') ?? '1'));
	const rangeStart = $derived(Math.max(1, currentPage - 2));
	const rangeEnd = $derived(Math.min(totalPages, currentPage + 2));

	const isFirstPage = $derived(currentPage === 1);
	const isLastPage = $derived(currentPage === totalPages || totalPages === 0);
	const hasMultiplePages = $derived(totalPages > 1);

	const visiblePages = $derived.by(() => {
		const pages: number[] = [];
		for (let i = rangeStart; i <= rangeEnd; i++) {
			pages.push(i);
		}
		if (!pages.includes(1) && totalPages > 0) pages.unshift(1);
		if (!pages.includes(totalPages) && totalPages > 0) pages.push(totalPages);
		return [...new Set(pages)].sort((a, b) => a - b);
	});

	function changePage(newPage: number) {
		if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
			return;
		}
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(newPage));

		goto(`?${params.toString()}`, { keepFocus: true, replaceState: true });
	}
</script>

<main>
	{#if hasMultiplePages}
		<div class="flex justify-center items-center w-full gap-2 text-sm md:text-base">
			<Button variant="ghost" size="icon" disabled={isFirstPage} onclick={() => changePage(1)}>
				<ChevronsLeft class="size-5" />
			</Button>

			<Button
				variant="ghost"
				size="icon"
				disabled={isFirstPage}
				onclick={() => changePage(currentPage - 1)}
			>
				<ArrowLeft class="size-5" />
			</Button>

			<!-- number pages -->
			{#each visiblePages as p}
				{#if p === totalPages && !visiblePages.includes(totalPages - 1) && totalPages > currentPage + 2}
					<span class="text-muted-foreground">...</span>
				{/if}
				{#if p === 1 && !visiblePages.includes(2) && totalPages > currentPage + 2 && currentPage > 3}
					<span class="text-muted-foreground">...</span>
				{/if}
				<Button
					variant={p === currentPage ? 'default' : 'secondary'}
					size="sm"
					class={p === currentPage ? 'font-bold' : ''}
					onclick={() => changePage(p)}
					disabled={p === currentPage}
				>
					{p}
				</Button>
				{#if p === 1 && !visiblePages.includes(2) && currentPage > 3}
					<span class="text-muted-foreground">...</span>
				{/if}
				{#if p === totalPages && !visiblePages.includes(totalPages - 1) && currentPage < totalPages - 2}
					<span class="text-muted-foreground">...</span>
				{/if}
			{/each}

			<Button
				variant="ghost"
				size="icon"
				disabled={isLastPage}
				onclick={() => changePage(currentPage + 1)}
			>
				<ArrowRight class="size-5" />
			</Button>

			<Button
				variant="ghost"
				size="icon"
				disabled={isLastPage}
				onclick={() => changePage(totalPages)}
			>
				<ChevronsRight class="size-5" />
			</Button>
		</div>
	{/if}
</main>
