<template>
  <div class="skeleton-card" aria-hidden="true">
    <div class="skeleton-card__line skeleton-card__line--title"></div>
    <div class="skeleton-card__line"></div>
    <div class="skeleton-card__line skeleton-card__line--short"></div>
    <div class="skeleton-card__row">
      <div class="skeleton-card__pill"></div>
      <div class="skeleton-card__pill"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.skeleton-card {
  border-radius: var(--radius-card);
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton-card__line {
  height: 12px;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--color-beige-600) 25%, var(--color-beige-500) 37%, var(--color-beige-600) 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;

  &--title {
    width: 60%;
    height: 16px;
  }

  &--short {
    width: 40%;
  }
}

.skeleton-card__row {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.skeleton-card__pill {
  width: 64px;
  height: 20px;
  border-radius: var(--radius-pill);
  background: var(--color-beige-600);
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-card__line {
    animation: none;
  }
}
</style>
