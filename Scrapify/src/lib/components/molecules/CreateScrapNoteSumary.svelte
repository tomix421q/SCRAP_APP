<script lang="ts">
	import { createScrapNotesStore } from '@/stores/stores';
	import { ArrowRight, Minus } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';
	import { handleClickMinus } from '@/utils/frontHelp';
</script>

<main class="formNormalize w-full flex-grow overflow-y-auto">
	<section class="text-center">
		<h2 class="text-center font-semibold text-2xl text-primary">Sumar poznamky 👀</h2>

		<span class="text-xs text-muted-foreground">Rychly a prehladny sumar poznamok.</span>
	</section>

	<!--  -->
	{#if $createScrapNotesStore.length > 0}
		<section class="flex flex-col h-[255px] *:even:bg-muted/20 *:not-even:bg-muted/10">
			{#each $createScrapNotesStore as note}
				<!-- NOTE -->

				<article class="flex rounded-sm p-1">
					<!-- PART  -->
					<p class="flex">
						{note.partNumber}:<span class="text-primary font-bold">{note.quantity}</span><ArrowRight
						/>
					</p>

					<!-- SCRAP Map -->
					<div class="flex flex-wrap items-center gap-2">
						{#each note.scrapCode as scrap}
							<p class="flex items-center">
								<span>{scrap.sc}</span>-<span class="text-primary font-bold">{scrap.qnt}</span>
								<Button
									variant="destructive"
									size="icon"
									class="size-5 mx-1"
									onclick={() => handleClickMinus(note.partNumber, scrap.sc)}><Minus /></Button
								>,
							</p>
						{/each}
					</div>
				</article>
			{/each}
		</section>
	{:else}
		<p class="text-center my-auto text-muted text-xl pb-14">Ziadne poznamky <br /> 😓</p>
	{/if}
</main>
