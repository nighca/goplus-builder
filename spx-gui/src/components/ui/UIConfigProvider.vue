<template>
  <NConfigProvider class="ui-config-provider" :theme-overrides="themeOverrides" :style="cssVariables">
    <slot></slot>
  </NConfigProvider>
</template>

<script lang="ts">
import { type GlobalThemeOverrides } from 'naive-ui'
import { inject, type InjectionKey } from 'vue'
import * as colors from './color'

const borderRadius1 = '8px'
const borderRadius2 = '12px'
const borderRadius3 = '20px'

const boxShadow1 = '0px 4px 12px 0px #D0F2F8' // TODO: color
const boxShadow2 = '0px 8px 24px 0px #00000014' // TODO: color

const lineHeight1 = 32 // px

const colorPrimary = colors.turquoise
const colorPrimary1 = colors.turquoise1
const colorPrimary2 = colors.turquoise2
const colorPrimary3 = colors.turquoise3
const colorPrimary4 = colors.turquoise4
const colorPrimary5 = colors.turquoise5
const colorPrimary6 = colors.turquoise6
const colorPrimary7 = colors.turquoise7
const colorPrimary8 = colors.turquoise8
const colorPrimary9 = colors.turquoise9
const colorPrimary10 = colors.turquoise10
const colorPrimary11 = colors.turquoise11

// const boxShadowPanel = boxShadows[1]
// const boxShadowDropdown = boxShadows[2]

// const borderRadiusButton = borderRadiuses[1]
// const borderRadiusPanel = borderRadiuses[2]

const uiVariables = {
  borderRadius1: borderRadius1,
  borderRadius2: borderRadius2,
  borderRadius3: borderRadius3,
  boxShadow1: boxShadow1,
  boxShadow2: boxShadow2,
  lineHeight1: lineHeight1,
  colorGrey1: colors.grey1,
  colorGrey2: colors.grey2,
  colorGrey3: colors.grey3,
  colorGrey4: colors.grey4,
  colorGrey5: colors.grey5,
  colorGrey6: colors.grey6,
  colorGrey7: colors.grey7,
  colorGrey8: colors.grey8,
  colorGrey9: colors.grey9,
  colorGrey10: colors.grey10,
  colorPrimary,
  colorPrimary1: colorPrimary1,
  colorPrimary2: colorPrimary2,
  colorPrimary3: colorPrimary3,
  colorPrimary4: colorPrimary4,
  colorPrimary5: colorPrimary5,
  colorPrimary6: colorPrimary6,
  colorPrimary7: colorPrimary7,
  colorPrimary8: colorPrimary8,
  colorPrimary9: colorPrimary9,
  colorPrimary10: colorPrimary10,
  colorPrimary11: colorPrimary11,
  // TOOD: more
}

const uiVariablesKey: InjectionKey<typeof uiVariables> = Symbol('theme-variables')

export function useUIVariables() {
  const vars = inject(uiVariablesKey)
  if (vars == null) throw new Error('useUIVariables should be called inside of UIConfigProvider')
  return vars
}

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: colorPrimary,
    textColorBase: colors.grey9, // TODO: check text color
    textColor1: colors.grey9,
    textColor2: colors.grey9,
    textColor3: colors.grey9,
    boxShadow1,
    boxShadow2,
    borderRadiusSmall: borderRadius1,
    borderRadius: borderRadius2
  },
  Button: {
    // TODO: more
  }
}
</script>

<script setup lang="ts">
import { NConfigProvider } from 'naive-ui'
import { provide } from 'vue'

provide(uiVariablesKey, uiVariables)

// TODO: generated from `uiVariables`?
const cssVariables = {
  '--ui-border-radius-1': uiVariables.borderRadius1,
  '--ui-border-radius-2': uiVariables.borderRadius2,
  '--ui-border-radius-3': uiVariables.borderRadius3,
  '--ui-box-shadow-1': uiVariables.boxShadow1,
  '--ui-box-shadow-2': uiVariables.boxShadow2,
  '--ui-line-height-1': uiVariables.lineHeight1,
  '--ui-color-grey-1': uiVariables.colorGrey1,
  '--ui-color-grey-2': uiVariables.colorGrey2,
  '--ui-color-grey-3': uiVariables.colorGrey3,
  '--ui-color-grey-4': uiVariables.colorGrey4,
  '--ui-color-grey-5': uiVariables.colorGrey5,
  '--ui-color-grey-6': uiVariables.colorGrey6,
  '--ui-color-grey-7': uiVariables.colorGrey7,
  '--ui-color-grey-8': uiVariables.colorGrey8,
  '--ui-color-grey-9': uiVariables.colorGrey9,
  '--ui-color-grey-10': uiVariables.colorGrey10,
  '--ui-color-primary': colorPrimary,
  '--ui-color-primary-1': uiVariables.colorPrimary1,
  '--ui-color-primary-2': uiVariables.colorPrimary2,
  '--ui-color-primary-3': uiVariables.colorPrimary3,
  '--ui-color-primary-4': uiVariables.colorPrimary4,
  '--ui-color-primary-5': uiVariables.colorPrimary5,
  '--ui-color-primary-6': uiVariables.colorPrimary6,
  '--ui-color-primary-7': uiVariables.colorPrimary7,
  '--ui-color-primary-8': uiVariables.colorPrimary8,
  '--ui-color-primary-9': uiVariables.colorPrimary9,
  '--ui-color-primary-10': uiVariables.colorPrimary10,
  '--ui-color-primary-11': uiVariables.colorPrimary11,
}
</script>

<style lang="scss" scoped>
.ui-config-provider {
  height: 100%;

  // TODO: global.scss or here?
  color: var(--ui-color-grey-9);
}
</style>
