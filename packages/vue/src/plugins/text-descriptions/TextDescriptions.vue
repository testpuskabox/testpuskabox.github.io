<template>
<div
    class="text-descriptions"
    role="log"
    aria-atomic="false"
    aria-relevant="additions"
    aria-live="polite"
>
    <p v-for="line in lines" :key="line.id">{{ line.text }}</p>
</div>
</template>


<script lang="ts">
import { defineComponent, inject } from 'vue'
import { CommonEntities } from '@tv/shared'
import { InjectionKeys } from '../../InjectionKeys'

export default defineComponent({
    // Typesafe injections are only available in the composition api
    setup() {
        return {
            announcment: inject(InjectionKeys.textDescriptions.announcement)
        }
    },

    ecastKeys: {
        textDescriptions: 'textDescriptions'
    },

    data() {
        return {
            lines: <CommonEntities.TextDescription[]> []
        }
    },

    computed: {
        textDescriptions(): CommonEntities.TextDescriptions | null {
            if (!this.$ecastValues) return null
            if (!this.$ecastValues.textDescriptions) return null
            return this.$ecastValues.textDescriptions as CommonEntities.TextDescriptions
        }
    },

    watch: {
        'announcment': function w(announcment: string) {
            this.lines.push({
                id: Math.random(),
                category: 'announce',
                text: announcment
            })
        },

        'textDescriptions.latestDescriptions': function w(items: CommonEntities.TextDescription[]) {
            if (!items || !items.length) return

            items.forEach((item) => {
                if (item.id !== undefined && this.lines.find((line) => line.id === item.id)) {
                    return
                }

                this.lines.push(item)
            })
        }
    }
})
</script>


<style lang="scss">
.text-descriptions {
    position: absolute;
    left: -10000px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
}
</style>
