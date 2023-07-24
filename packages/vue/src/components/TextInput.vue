<template>
<input ref="input" :value="modelValue" v-on:input="onInput">
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Sanitize } from '@tv/shared'

/**
 * A input component for text that abstracts the weirdness away from Android
 * soft keyboards' keyboard event handlers. This component can be used exactly
 * as if it was an input itself.
 */

export default defineComponent({
    props: {
        modelValue: String,
        sanitizers: Array as Prop<Sanitize.Type[]>
    },

    emits: {
        'update:modelValue': (_: string) => true
    },

    watch: {
        modelValue(newValue, oldValue) {
            if (newValue !== oldValue) {
                const input = this.$refs.input as HTMLInputElement
                input.value = newValue
            }
        }
    },

    methods: {
        async onInput(event: Event) {
            const target = event.target as HTMLInputElement
            const maxLength = target.maxLength === -1 ? Number.MAX_SAFE_INTEGER : target.maxLength

            if (this.sanitizers) {
                target.value = Sanitize.withTypes(target.value, [...this.sanitizers])
            }

            if (target.value.length > maxLength) {
                target.value = target.value.substring(0, maxLength)
                return
            }

            this.$emit('update:modelValue', target.value)

            // wait one tick to allow any listeners to
            // modify the value and then apply the change
            await this.$nextTick()
            if (target.value !== this.modelValue) {
                target.value = this.modelValue!
            }
        }
    }
})
</script>
