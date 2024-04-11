<template>
  <div class="ui-panel">
    <slot></slot>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.ui-panel {
  box-shadow: var(--ui-box-shadow-1);
  border-radius: var(--ui-border-radius-3);
  background-color: #fff; /** TODO: define as var */
}
</style>
