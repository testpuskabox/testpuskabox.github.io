<template>
<div v-pointerbox class="tutorial" v-on:pointerbox:swipe="onPointerBoxSwipe">
    <div class="container">
        <!-- eslint-disable-next-line vue/html-self-closing -->
        <svg class="ratio-svg" width="2" height="3"></svg>
        <div
            v-for="slide, index in slides" :key="index" class="slide"
            :class="slideClasses[index]"
        >
            <div class="text">
                <h3 class="title">{{ slide.title }}</h3>
                <ul v-if="slide.listItems">
                    <li v-for="item, iIndex in slide.listItems" :key="iIndex">{{ item }}</li>
                </ul>
            </div>
            <div v-if="slide.imageClass" class="image" :class="slide.imageClass" />

            <div v-if="slide.arrow" class="arrow" :style="slide.arrow">
                <svg viewBox="0 0 50 50">
                    <path d="M -50,0 L 0,0" vector-effect="non-scaling-stroke" />
                    <path d="M -25,-20 L 0,0 L -25,20" vector-effect="non-scaling-stroke" />
                </svg>
            </div>
        </div>

        <div class="dots">
            <button
                v-for="n in slides!.length" :key="n" class="dot"
                :class="{ current: currentIndex === n - 1 }"
                v-on:pointerbox:childup="onDotClick(n - 1)"
            />
        </div>

        <div class="buttons">
            <button v-if="!isFinalSlide" class="skip" v-on:pointerbox:childup="onDoneClick">{{ $t('TUTORIAL.BUTTON_SKIP') }}</button>
            <button v-if="!isFinalSlide" class="next" v-on:pointerbox:childup="onNextClick">{{ $t('TUTORIAL.BUTTON_NEXT') }}</button>
            <button v-else class="done" v-on:pointerbox:childup="onDoneClick">{{ $t('TUTORIAL.BUTTON_DONE') }}</button>
        </div>
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent, getCurrentInstance } from 'vue'
import type { PointerBox } from '@tv/shared'

export interface TutorialSlide {
    title: string
    listItems?: string[]
    imageClass?: string
    arrow?: {
        top: string
        left: string
        transform?: string
    }
}

export default defineComponent({
    props: {
        slides: Array as Prop<TutorialSlide[]>
    },

    emits: ['tutorialComplete'],

    data() {
        return {
            currentIndex: 0
        }
    },

    computed: {
        isFinalSlide(): boolean {
            return this.currentIndex === this.slides!.length - 1
        },

        slideClasses(): string[][] {
            return this.slides!.map((_, index) => {
                if (index < this.currentIndex) return ['left']
                if (index > this.currentIndex) return ['right']
                return ['current']
            })
        }
    },

    beforeMount() {
        const instance = getCurrentInstance()
        if (!instance?.appContext.directives.pointerbox) {
            throw new Error('Tutorial.vue relies on PointerBoxPlugin. Please install it inside your main.ts file.')
        }
    },

    methods: {
        onPointerBoxSwipe(event: PointerBox.SwipeEvent) {
            if (event.detail.direction === 'right') {
                if (this.currentIndex === 0) return
                this.currentIndex -= 1
            }

            if (event.detail.direction === 'left') {
                if (this.isFinalSlide) {
                    this.onDoneClick()
                    return
                }

                this.currentIndex += 1
            }
        },

        onNextClick() {
            if (this.isFinalSlide) {
                this.onDoneClick()
                return
            }

            this.currentIndex += 1
        },

        onDotClick(index: number) {
            this.currentIndex = index
        },

        onDoneClick() {
            this.$emit('tutorialComplete')
        }
    }
})
</script>


<style lang="scss" scoped>
@use '@tv/shared/src/styles/jbg.scss' as jbg;

@mixin portrait {
    @media only screen and (orientation: portrait) { @content; }
}

@mixin landscape {
    @media only screen and (orientation: landscape) { @content; }
}

.tutorial {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    user-select: none;
}

.container {
    position: absolute;
    top: 50%;
    left: 50%;
    text-align: center;
    line-height: 0;
    transform: translate(-50%, calc(-50% - 40px));

    @include portrait {
        width: calc(100% - 85px);
        max-width: 400px;
        min-width: 300px;

        .ratio-svg {
            width: 100%;
            height: auto;
        }
    }

    @include landscape() {
        height: calc(100% - 85px);
        max-height: 600px;
        min-height: 200px;

        .ratio-svg {
            width: auto;
            height: 100%;
        }
    }
}

.slide {
    position: absolute;
    display: flex;
    flex-direction: column;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 25px 35px 30px;
    background: #FFF;
    border-radius: 15px;
    transition: opacity 0.25s, transform 0.25s;

    &.left {
        opacity: 0;
        transform: translateX(-75px) scale(0.9);
    }

    &.right {
        opacity: 0;
        transform: translateX(75px) scale(0.9);
    }

    .text {
        text-align: left;
        font-family: jbg.$helvetica;

        h3 {
            line-height: 1.2;
            padding-bottom: 6%;
        }

        ul {
            padding-left: 16px;
        }

        li {
            line-height: 1.2;
            padding-bottom: 5px;
        }

        @include portrait {
            h3 {
                font-size: clamp(18px, 5.2vw, 24px);
            }

            li {
                font-size: clamp(14px, 4vw, 18px);
            }
        }

        @include landscape() {
            h3 {
                font-size: clamp(16px, 3.8vh, 24px);
            }

            li {
                font-size: clamp(13px, 3vh, 18px);
            }
        }
    }

    .image {
        width: 100%;
        flex-grow: 1;
        background-position: center bottom;
        background-size: contain;
        background-repeat: no-repeat;
    }
}

.arrow {
    position: absolute;
    width: 10%;
    transform-origin: top left;

    svg {
        width: 100%;
        stroke: jbg.$blue;
        stroke-width: 6px;
        fill: transparent;
        stroke-linecap: round;
        stroke-linejoin: round;
        overflow: visible;
        animation: arrow-bounce 0.5s alternate infinite;
    }
}

.dots {
    position: absolute;
    bottom: 12px;
    left: 0;
    width: 100%;

    .dot {
        width: 8px;
        height: 8px;
        margin: 0 5px;
        padding: 0;
        border: none;
        border-radius: 4px;
        background: #CCC;
        transition: background-color 0.25s, transform 0.25s;

        &.current {
            background: jbg.$blue;
            transform: scale(1.5);
        }
    }
}

.buttons {
    position: absolute;
    bottom: -40px;
    width: 100%;

    button {
        height: 32px;
        background: none;
        border: none;
        color: #FFF;
    }

    .skip {
        float: left;
        font-size: 15px;
    }

    .next, .done {
        float: right;
        padding: 0 20px;
        border-radius: 20px;
        background: jbg.$blue;
        font-size: 17px;
        box-shadow: 0 4px 0 0 jbg.$blueDarker;
        transition: box-shadow 0.2s;

        &:active {
            box-shadow: 0 0 0 0 jbg.$blueDarker;
        }
    }

    .done {
        background: #FFF;
        color: jbg.$blue;
        animation: done-pulse 0.5s alternate infinite;
    }
}

@keyframes arrow-bounce {
    0% { transform: translateX(0); }
    100% { transform: translateX(-20%); }
}

@keyframes done-pulse {
    0% { background: jbg.$offWhite; }
    100% { transform: #FFF; }
}
</style>
