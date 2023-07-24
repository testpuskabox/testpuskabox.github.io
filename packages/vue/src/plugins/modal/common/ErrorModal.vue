<template>
<div class="error-model" :class="classes">
    <img v-if="image === 'tear'" class="image" src="./tear.png" alt="Kicked">
    <img v-else-if="image === 'moon'" class="image" src="./moon.png" alt="Thank You">
    <img v-else class="image" src="./poop.png" alt="Error">

    <!-- Temp disabling of these rules waiting for a PR to be merged with the plugin -->
    <!-- https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility/pull/196 -->
    <!-- eslint-disable-next-line vuejs-accessibility/heading-has-content -->
    <h3 v-bb="text" class="text" />
    <!-- eslint-disable-next-line vuejs-accessibility/heading-has-content -->
    <h3 v-if="subtext" v-bb="subtext" class="subtext" />
    <div class="actions">
        <button v-bb="dismissText" v-on:click.prevent="$emit('resolve')" />
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        image: String,
        text: String,
        subtext: String,
        classes: {
            type: [Array, String] as Prop<string[] | string>,
            default: () => 'jbg'
        },
        dismissText: String
    }
})
</script>


<style lang="scss" scoped>
@use '@tv/shared/src/styles/jbg.scss' as jbg;
</style>
