<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "$lib/components/ui/tabs";
  import {Textarea} from "$lib/components/ui/textarea";
  import {Label} from "$lib/components/ui/label";
  import {Badge} from "$lib/components/ui/badge";
  import {Upload} from "@lucide/svelte";
  import {formatBytes} from "$lib/utils/format";

  interface Props {
    label: string;
    data: Uint8Array | null;
    onDataChange: (data: Uint8Array | null) => void;
  }

  let {label, data, onDataChange}: Props = $props();

  let textValue = $state("");
  let inputMode = $state<"text" | "file">("text");
  let isDragging = $state(false);
  let fileInputRef: HTMLInputElement | null = $state(null);

  const size = $derived(data?.length ?? 0);

  function handleTextChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    textValue = target.value;
    if (target.value) {
      onDataChange(new TextEncoder().encode(target.value));
    } else {
      onDataChange(null);
    }
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      readFile(file);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      readFile(file);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  async function readFile(file: File) {
    const buffer = await file.arrayBuffer();
    onDataChange(new Uint8Array(buffer));
  }

  function handleDropZoneClick() {
    fileInputRef?.click();
  }

  function handleDropZoneKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef?.click();
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <Label class="text-sm font-medium">{label}</Label>
    {#if size > 0}
      <Badge variant="secondary" class="text-xs">
        {formatBytes(size)}
      </Badge>
    {/if}
  </div>

  <Tabs bind:value={inputMode} class="w-full">
    <TabsList class="grid w-full grid-cols-2">
      <TabsTrigger value="text">{m.demo_input_tab_text()}</TabsTrigger>
      <TabsTrigger value="file">{m.demo_input_tab_file()}</TabsTrigger>
    </TabsList>

    <TabsContent value="text" class="mt-4">
      <Textarea
        placeholder={m.demo_input_placeholder()}
        class="min-h-32 resize-y font-mono text-sm"
        value={textValue}
        oninput={handleTextChange}
      />
    </TabsContent>

    <TabsContent value="file" class="mt-4">
      <input
        bind:this={fileInputRef}
        type="file"
        class="hidden"
        onchange={handleFileSelect}
      />
      <button
        type="button"
        class="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 transition-colors duration-150 {isDragging
          ? 'border-primary bg-accent'
          : 'border-input hover:border-primary hover:bg-accent/50'}"
        ondrop={handleDrop}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        onclick={handleDropZoneClick}
        onkeydown={handleDropZoneKeydown}
      >
        <Upload class="text-muted-foreground h-8 w-8" />
        <p class="text-muted-foreground text-sm">{m.demo_input_dropzone()}</p>
        {#if size > 0}
          <Badge variant="outline">{formatBytes(size)}</Badge>
        {/if}
      </button>
    </TabsContent>
  </Tabs>
</div>
