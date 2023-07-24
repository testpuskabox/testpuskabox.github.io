<template>
<div class="options-modal" :class="classes">
    <!-- Temp disabling of these rules waiting for a PR to be merged with the plugin -->
    <!-- https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility/pull/196 -->
    <!-- eslint-disable-next-line vuejs-accessibility/heading-has-content -->
    <h3 v-bb="text" class="text" />
    <!-- eslint-disable-next-line vuejs-accessibility/heading-has-content -->
    <h3 v-if="subtext" v-bb="subtext" class="subtext" />
    <div class="actions">
        <button
            v-for="(option, index) in options"
            :key="index"
            v-bb="option.text"
            :class="option.classes"
            v-on:click.prevent="$emit('resolve', option.value)"
        />
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'

interface Option {
    text: string
    classes?: string[] | string
    value: any
}

export default defineComponent({
    props: {
        text: String,
        subtext: String,
        classes: {
            type: [Array, String] as Prop<string[] | string>,
            default: () => 'jbg'
        },
        options: Array as Prop<Option[]>
    },

    emits: [
        'resolve'
    ]
})
</script>


<style lang="scss" scoped>
@use '@tv/shared/src/styles/jbg.scss' as jbg;

button.audience,
button.twitch {
    line-height: 1;
}

button.twitch {
    background: jbg.$twitch;
}
</style>
