<template>
<div class="draw">
    <div ref="content" class="content">
        <div class="constrain">
            <div v-if="player!.prompt" v-bb="player!.prompt" />
            <!-- tools -->
            <div ref="stage" class="stage" :style="stageDimensions" />
            <button v-on:click.prevent="onSubmitClick">{{ player!.submitText || 'SUBMIT' }}</button>
        </div>
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent, reactive } from 'vue'
import { CommonEntities, DrawStage } from '@tv/shared'
import { DebouncedFunc, throttle } from 'lodash'

export default defineComponent({
    props: {
        player: Object as Prop<CommonEntities.Draw>
    },

    data() {
        return {
            onResizeWithContext: null as DebouncedFunc<() => void> | null,
            stage: null as DrawStage | null,
            windowHeight: window.innerHeight,
            isSubmitting: false
        }
    },

    computed: {
        stageDimensions(): { width: string, height: string } {
            if (!this.stage) return { width: 'auto', height: 'auto' }
            const contentEl = this.$refs.content as HTMLElement
            const contentRect = contentEl.getBoundingClientRect()

            const stageEl = this.$refs.stage as HTMLElement
            const stageRect = stageEl.getBoundingClientRect()

            const parentRect = stageEl.parentElement!.getBoundingClientRect()

            const containerWidth = Math.max(
                parentRect.width * 0.9, // 5% margins
                240 // Don't shrink the width smaller than 240px
            )
            const containerHeight = Math.max(
                this.windowHeight - contentRect.height + stageRect.height,
                240 // Don't shrink the height smaller than 240px
            )

            const canvasWidth = this.stage.canvas.width
            const canvasHeight = this.stage.canvas.height

            const ratio = Math.min( // Cover is max, contain is min
                (containerWidth / canvasWidth),
                (containerHeight / canvasHeight)
            )

            const finalWidth = canvasWidth * ratio
            const finalHeight = canvasHeight * ratio

            return {
                width: `${finalWidth}px`,
                height: `${finalHeight}px`
            }
        }
    },

    mounted() {
        this.onResizeWithContext = throttle(this.onResize.bind(this), 400)
        window.addEventListener('resize', this.onResizeWithContext)
        this.setupStage()
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.onResizeWithContext!)
        if (this.stage) this.stage.beforeDestroy()
    },

    methods: {
        setupStage() {
            const stageEl = this.$refs.stage as HTMLElement
            const drawOptions: DrawStage.InitOptions = {}
            if (this.player!.size) {
                drawOptions.width = this.player!.size.width
                drawOptions.height = this.player!.size.height
            }
            if (this.player!.thicknesses) {
                drawOptions.thickness = this.player!.thicknesses[0]
            }

            if (this.player!.colors) {
                drawOptions.color = this.player!.colors[0]
            }

            if (this.player!.maxPoints) {
                drawOptions.maxPoints = this.player!.maxPoints
            }

            const stage = new DrawStage(stageEl, drawOptions)
            stage.canvas.lines = reactive([])
            stage.canvas.lines2 = reactive([])

            this.stage = stage
            this.stage.on('up', () => {
                if (!this.player!.live) return
                const data = this.stage?.getObject() || {}
                data.done = false
                void this.$ecast.updateObject(this.player!.responseKey, data).catch(this.$handleEcastError)
            })
        },

        onSubmitClick() {
            if (!this.stage) return
            this.isSubmitting = true
            this.stage.canvas.submitting = true
            const data = this.stage.getObject()
            data.done = true
            data.action = 'submit' // Should probably pick one
            void this.$ecast.updateObject(this.player!.responseKey, data).catch(this.$handleEcastError)
        },

        onResize() {
            this.windowHeight = window.innerHeight
        }
    }
})
</script>
