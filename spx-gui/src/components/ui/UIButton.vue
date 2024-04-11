<template>
  <button class="ui-button" :class="`type-${type}`">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
type ButtonType = 'primary' | 'secondary' | 'boring' | 'danger' | 'success'

const props = withDefaults(defineProps<{
  type?: ButtonType
}>(), {
  type: 'primary'
})
</script>

<style lang="scss" scoped>
.ui-button {
  display: flex;
  height: 32px; // TODO: var
  padding: 4px var(--gap-md, 16px);
  align-items: center;
  gap: 4px;

  border: none;
  border-bottom-width: 4px;
  border-bottom-style: solid;
  border-radius: var(--ui-border-radius-2);
  cursor: pointer;

  &:not(:disabled):active {
    border-bottom-width: 0;
  }

  &:disabled, &:disabled:hover {
    cursor: not-allowed;
    color: var(--ui-color-grey-6);
    background-color: var(--ui-color-grey-3);
    border-bottom-color: var(--ui-color-grey-5);
  }
}

.type-primary {
  color: var(--ui-color-grey-1);
  background-color: var(--ui-color-primary);
  border-bottom-color: var(--ui-color-primary-10);

  &:hover:not(:active) {
    background-color: var(--ui-color-primary-6);
  }
}

.type-boring {
  color: var(--ui-color-grey-9);
  background-color: var(--ui-color-grey-3);
  border-bottom-color: var(--ui-color-grey-6);

  &:hover:not(:active) {
    background-color: var(--ui-color-grey-2);
  }
}

// TODO: other types

</style>
