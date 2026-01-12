<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import "./layout.css";
  import {Button} from "$lib/components/ui/button";
  import {TooltipProvider} from "$lib/components/ui/tooltip";
  import {Sun, Moon} from "@lucide/svelte";
  import {onMount} from "svelte";

  let {children} = $props();

  let isDark = $state(false);

  onMount(() => {
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      isDark = true;
    } else if (savedTheme === "light") {
      isDark = false;
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    updateTheme();
  });

  function toggleTheme() {
    isDark = !isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateTheme();
  }

  function updateTheme() {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
</script>

<svelte:head>
  <title>{m.demo_header_title()}</title>
</svelte:head>

<TooltipProvider>
  <div class="bg-background text-foreground min-h-screen">
    <header class="border-b">
      <div class="mx-auto flex max-w-6xl items-center justify-end p-4">
        <Button
          variant="ghost"
          size="sm"
          onclick={toggleTheme}
          aria-label={isDark ? m.common_light_mode() : m.common_dark_mode()}
        >
          {#if isDark}
            <Sun class="h-4 w-4" />
          {:else}
            <Moon class="h-4 w-4" />
          {/if}
        </Button>
      </div>
    </header>

    <main>
      {@render children()}
    </main>
  </div>
</TooltipProvider>
