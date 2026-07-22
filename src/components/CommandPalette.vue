<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useLinks } from "../composables/useLinks";
import type { Scope } from "../types/links";
import Icon from "./Icon.vue";

const { links, categories, paletteOpen, selectScope } = useLinks();

const query = ref("");
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);

const categoryName = computed(() => {
  const map = new Map<string, string>(categories.value.map((c) => [c.id, c.name] as const));
  return (id: string) => map.get(id) ?? id;
});

const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  const base = links.value;
  const matched = !q
    ? base
    : base.filter((l) =>
        [l.title, l.description, l.owner, l.country, l.category, ...l.tags].join(" ").toLowerCase().includes(q),
      );
  return matched.slice(0, 8);
});

watch(results, () => (activeIndex.value = 0));

function open() {
  paletteOpen.value = true;
}
function close() {
  paletteOpen.value = false;
  query.value = "";
}

function openLink(url: string) {
  window.open(url, "_blank", "noopener");
  close();
}

function onKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    paletteOpen.value ? close() : open();
    return;
  }
  if (!paletteOpen.value) return;

  if (event.key === "Escape") {
    event.preventDefault();
    close();
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1);
    scrollActiveIntoView();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
    scrollActiveIntoView();
  } else if (event.key === "Enter") {
    const item = results.value[activeIndex.value];
    if (item) openLink(item.url);
  }
}

function scrollActiveIntoView() {
  nextTick(() => {
    const el = listRef.value?.querySelector<HTMLElement>(`[data-index="${activeIndex.value}"]`);
    el?.scrollIntoView({ block: "nearest" });
  });
}

function jumpToCategory(id: Scope) {
  selectScope(id);
  close();
  document.getElementById("link-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

watch(paletteOpen, (isOpen) => {
  if (isOpen) nextTick(() => inputRef.value?.focus());
});

onMounted(() => document.addEventListener("keydown", onKeydown));
onUnmounted(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="paletteOpen" class="palette" @click.self="close">
        <div class="palette__panel" role="dialog" aria-modal="true" aria-label="Command palette">
          <div class="palette__search">
            <Icon name="search" :size="18" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Search links, owners, tags…"
              aria-label="Command palette search"
            />
            <kbd class="mono">Esc</kbd>
          </div>

          <div ref="listRef" class="palette__results">
            <p v-if="results.length === 0" class="palette__empty">No matches.</p>
            <button
              v-for="(link, index) in results"
              :key="link.id"
              type="button"
              class="palette__item"
              :class="{ 'is-active': index === activeIndex }"
              :data-index="index"
              @mouseenter="activeIndex = index"
              @click="openLink(link.url)"
            >
              <span class="palette__item-main">
                <span class="palette__item-title">{{ link.title }}</span>
                <span class="palette__item-cat mono">{{ categoryName(link.category) }}</span>
              </span>
              <Icon name="arrowRight" :size="15" class="palette__item-arrow" />
            </button>
          </div>

          <div class="palette__footer">
            <span><kbd class="mono">↑↓</kbd> navigate</span>
            <span><kbd class="mono">↵</kbd> open</span>
            <button type="button" class="palette__jump" @click="jumpToCategory('critical')">Jump to critical files</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.palette {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12vh var(--space-md) var(--space-md);
  background: rgba(7, 20, 49, 0.5);
  backdrop-filter: blur(4px);
}

.palette__panel {
  width: 100%;
  max-width: 560px;
  background: var(--color-background-400);
  border: 1px solid var(--color-card-border-hover);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 64px rgba(7, 20, 49, 0.34);
  overflow: hidden;
}

.palette__search {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-card-border);
  color: var(--color-text-200);

  input {
    flex: 1;
    border: none;
    outline: none;
    background: none;
    font-size: var(--font-size-md);
    color: var(--color-text-400);
  }

  kbd {
    font-size: 10px;
    border: 1px solid var(--color-card-border-hover);
    border-radius: var(--radius-sm);
    padding: 2px 6px;
  }
}

.palette__results {
  max-height: 340px;
  overflow-y: auto;
  padding: var(--space-xs);
}

.palette__empty {
  padding: var(--space-lg);
  text-align: center;
  color: var(--color-text-200);
  font-size: var(--font-size-sm);
}

.palette__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  width: 100%;
  padding: 10px var(--space-sm);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  text-align: left;

  &.is-active {
    background: var(--color-white-400);
    box-shadow: var(--shadow-card);
  }
}

.palette__item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.palette__item-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-400);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.palette__item-cat {
  font-size: 10px;
  color: var(--color-text-200);
}

.palette__item-arrow {
  color: var(--color-text-200);
  flex-shrink: 0;
}

.palette__footer {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--color-card-border);
  font-size: 11px;
  color: var(--color-text-200);

  kbd {
    border: 1px solid var(--color-card-border-hover);
    border-radius: var(--radius-sm);
    padding: 1px 5px;
    margin-right: 3px;
  }
}

.palette__jump {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-cyan-500);
  background: none;
  border: none;
  cursor: pointer;
}

.palette-enter-active,
.palette-leave-active {
  transition: opacity 0.18s var(--ease-power2-out);
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}
</style>
