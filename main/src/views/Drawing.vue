<template>
<div class="drawing">
    <div ref="content" class="content">
        <div class="header" v-text="player!.header" />
        <div class="constrain">
            <fieldset :disabled="isSubmitting">
                <div v-if="player!.prompt" class="prompt" v-text="player!.prompt" />
                <div class="controls">
                    <button
                        :class="{ 'frame-button': true, active: activeFrame === 0 }"
                        v-on:click.prevent.stop="onFrameClick(0)"
                    >
                        {{ $t('DRAWING.FRAME_1') }}
                    </button>
                    <button
                        :class="{ 'frame-button': true, active: activeFrame === 1 }"
                        v-on:click.prevent.stop="onFrameClick(1)"
                    >
                        {{ $t('DRAWING.FRAME_2') }}
                    </button>
                </div>
                <div ref="stage" class="stage" :style="stageDimensions" />
                <div v-if="player!.colors" class="palette">
                    <ColorButton
                        v-for="(hex, index) in player!.colors"
                        :key="index"
                        :class="{ color: true, active: activeColor === hex }"
                        :hex="hex"
                        :active="activeColor === hex"
                        v-on:clicked="onColorClick(hex)"
                    />
                </div>
                <button
                    type="submit"
                    class="submit-button"
                    :disabled="!canSubmit"
                    v-on:click.prevent.stop="onSubmitClick"
                >
                    {{ $t('DRAWING.BUTTON_SUBMIT') }}
                </button>
            </fieldset>
        </div>
    </div>
    <Tutorial
        v-if="player!.showTutorial && !hasSeenTutorial"
        :slides="slides"
        v-on:tutorial-complete="onTutorialComplete"
    />
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Draw, Tutorial, TutorialSlide } from '@tv/vue'
import ColorButton from './ColorButton.vue'
import type { DrawfulAnimate } from '../DrawfulAnimate'

export default defineComponent({
    components: {
        Tutorial,
        ColorButton
    },

    extends: Draw,

    props: {
        player: Object as Prop<DrawfulAnimate.Drawing.Entity>
    },

    data() {
        return {
            hasSeenTutorial: false,
            slides: <TutorialSlide[]> [
                {
                    title: this.$t('TUTORIAL.SLIDE_1_TITLE'),
                    listItems: [
                        this.$t('TUTORIAL.SLIDE_1_ITEM_1'),
                        this.$t('TUTORIAL.SLIDE_1_ITEM_2')
                    ],
                    imageClass: 'tutorial-0',
                    arrow: {
                        top: '33%',
                        left: '80%',
                        transform: 'rotate(135deg)'
                    }
                },
                {
                    title: this.$t('TUTORIAL.SLIDE_2_TITLE'),
                    listItems: [
                        this.$t('TUTORIAL.SLIDE_2_ITEM_1'),
                        this.$t('TUTORIAL.SLIDE_2_ITEM_2')
                    ],
                    imageClass: 'tutorial-1'
                },
                {
                    title: this.$t('TUTORIAL.SLIDE_3_TITLE'),
                    listItems: [
                        this.$t('TUTORIAL.SLIDE_3_ITEM_1'),
                        this.$t('TUTORIAL.SLIDE_3_ITEM_2')
                    ],
                    imageClass: 'tutorial-2',
                    arrow: {
                        top: '67%',
                        left: '20%'
                    }
                },
                {
                    title: this.$t('TUTORIAL.SLIDE_4_TITLE'),
                    listItems: [
                        this.$t('TUTORIAL.SLIDE_4_ITEM_1')
                    ],
                    imageClass: 'tutorial-3',
                    arrow: {
                        top: '87%',
                        left: '28%'
                    }
                },
                {
                    title: this.$t('TUTORIAL.SLIDE_5_TITLE'),
                    listItems: [],
                    imageClass: 'tutorial-4'
                }
            ]
        }
    },

    computed: {
        activeColor(): string {
            return this.stage ? this.stage.canvas.color : ''
        },

        activeFrame(): number {
            return this.stage ? this.stage.canvas.frame : 0
        },

        activeThickness(): number {
            return this.stage ? this.stage.canvas.thickness : 1
        },

        canSubmit(): boolean {
            return this.stage !== null
                && this.stage.canvas.lines.length > 0
                && this.stage.canvas.lines2.length > 0
        }
    },
    methods: {
        onFrameClick(index: number) {
            if (!this.stage) return
            this.stage.canvas.frame = index
        },

        onColorClick(hex: string) {
            if (!this.stage) return
            this.stage.canvas.color = hex
        },

        onTutorialComplete() {
            this.hasSeenTutorial = true
        }
    }
})
</script>

<style lang="scss">
.drawing {
    overflow-y: auto;
    position: relative;
    .prompt {
        text-align: center;
    }
    .draw-canvas {
        background-color: white;
    }
    .controls {
        margin: 0px auto -8px auto;
        text-align: center;
        overflow: hidden;
        z-index: 1;
        .frame-button {
            color: black;
            position: relative;
            font-size: 16px;
            width: 40%;
            max-width: 150px;
            margin: 6px auto 0px auto;
            border-style: solid;
            border-width: 7px;
            border-image: url("../images/TabInactiveBack.svg") 6 fill;
            border-bottom: 0;
            padding: 7px 0 3px;
            -webkit-background-clip: padding;
               -moz-background-clip: padding;
                    background-clip: padding-box;
            &.active {
                border-image: url("../images/TabActive.svg") 6 fill;

                &::after {
                    content: "";
                    position: absolute;
                    top: 100%;
                    left: -2px;
                    right: -2px;
                    height: 10px;
                    background: white;
                }
            }
        }
    }
    .stage {
        margin: 0px auto;
        canvas.draw-canvas {
            border-width: 8px;
            border-style: solid;
            border-image: url("../images/DrawingFrame.svg") 6 7;
            background-clip: padding-box;
        }
    }
    .palette {
        text-align: center;
        button {
            height: 50px;
            width: 50px;
            padding: 3px;
        }
    }
    .submit-button {
        font-size: 18px;
        padding: 5px 20%;
        color: white;
        background-color: black;
        border-radius: 6px;
        border: 6px solid black;
        &:active:not(:disabled) {
            color: black;
            background-color: white;
        }

        &:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
    }
}
.tutorial {
    .image {
        &.tutorial-0 { background-image: url("../images/tutorial_0.png"); }
        &.tutorial-1 { background-image: url("../images/tutorial_1.png"); }
        &.tutorial-2 { background-image: url("../images/tutorial_2.png"); }
        &.tutorial-3 { background-image: url("../images/tutorial_3.png"); }
        &.tutorial-4 {
            background-position: center;
            background-image: url("../images/tutorial_4.png");
        }
    }
}
</style>
