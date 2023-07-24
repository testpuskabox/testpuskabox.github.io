<template>
<div class="flipping scrollable">
    <div class="header" v-text="player!.header" />
    <div class="constrain">
        <div class="prompt" v-text="prompt" />
        <div v-if="!player!.success" class="flipchart">
            <div class="row">
                <button
                    class="circle-button right"
                    :class="{
                        selected: chosenKey === player!.countGroupChoices[0]
                    }"
                    :disabled="isSubmitting"
                    aria-label="Slide top row right"
                    v-on:click.prevent="voteClicked($event, 0)"
                />
                <button
                    class="circle-button left"
                    :class="{
                        selected: chosenKey === player!.countGroupChoices[1]
                    }"
                    :disabled="isSubmitting"
                    aria-label="Slide top row left"
                    v-on:click.prevent="voteClicked($event, 1)"
                />
                <div
                    :class="{
                        'slide-left': lastChange === 'topLeft',
                        'slide-right': lastChange === 'topRight'
                    }"
                    class="carousel top"
                >
                    <div class="owl prev" :class="topPrevName" />
                    <div class="owl" :class="topCurrentName" />
                    <div class="owl next" :class="topNextName" />
                </div>
            </div>
            <div class="row">
                <div
                    :class="{
                        'slide-left': lastChange === 'bottomLeft',
                        'slide-right': lastChange === 'bottomRight'
                    }"
                    class="carousel bottom"
                >
                    <div class="owl prev" :class="bottomPrevName" />
                    <div class="owl" :class="bottomCurrentName" />
                    <div class="owl next" :class="bottomNextName" />
                </div>
                <button
                    class="circle-button right"
                    :class="{
                        selected: chosenKey === player!.countGroupChoices[2]
                    }"
                    :disabled="isSubmitting"
                    aria-label="Slide bottom row right"
                    v-on:click.prevent="voteClicked($event, 2)"
                />
                <button
                    class="circle-button left"
                    :class="{
                        selected: chosenKey === player!.countGroupChoices[3]
                    }"
                    :disabled="isSubmitting"
                    aria-label="Slide bottom row left"
                    v-on:click.prevent="voteClicked($event, 3)"
                />
            </div>
            <div v-if="timer" class="timer">
                <span class="timer-bar" :style="`width: ${progressPercent}%`" />
            </div>
        </div>
        <div v-if="player!.success" class="">
            <div class="owl-complete" :class="completeName" />
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { DebouncedFunc, throttle } from 'lodash'
import { EcastRateLimitExceeded } from '@jackboxgames/ecast/errors'
import type { CommonEntities } from '@tv/shared'
import type { DrawfulAnimate } from '../DrawfulAnimate'

type ThrottledFunction = DebouncedFunc<() => Promise<void>>

export default defineComponent({
    props: {
        player: Object as Prop<DrawfulAnimate.Flipping.Entity>,
        timer: Object as Prop<CommonEntities.Timer>
    },

    data() {
        return {
            isSubmitting: false,
            chosenKey: '',
            lastSubmittedKey: '',
            lastChange: '',
            throttledSubmitVote: <ThrottledFunction|undefined> undefined
        }
    },

    computed: {
        prompt(): string {
            if (this.chosenKey !== '') return this.$t('FLIPPING.DONE_TEXT').toString()
            return this.player!.prompt
        },

        topPrevName(): string {
            const index = (this.player!.topOrder.length + this.player!.topIndex - 1) % this.player!.topOrder.length
            return this.player!.topOrder[index]
        },

        topCurrentName(): string {
            return this.player!.topOrder[this.player!.topIndex]
        },

        topNextName(): string {
            const topNextIndex = (this.player!.topIndex + 1) % this.player!.topOrder.length
            return this.player!.topOrder[topNextIndex]
        },

        bottomPrevName(): string {
            const index = (this.player!.bottomOrder.length + this.player!.bottomIndex - 1)
                % this.player!.bottomOrder.length
            return this.player!.bottomOrder[index]
        },

        bottomCurrentName(): string {
            return this.player!.bottomOrder[this.player!.bottomIndex]
        },

        bottomNextName(): string {
            const bottomNextIndex = (this.player!.bottomIndex + 1) % this.player!.bottomOrder.length
            return this.player!.bottomOrder[bottomNextIndex]
        },

        completeName(): string {
            if (!this.player!.success) return ''
            return `OwlComplete_${this.player!.owlIndex}`
        },

        progressPercent(): number {
            return (this.timer!.timeLeft % 10 / 10) * 100
        }
    },

    watch: {
        'player.bottomIndex': function resetChoices(newIndex, old) {
            if (!this.player!.bottomOrder) return

            this.chosenKey = ''
            this.isSubmitting = false
            this.lastSubmittedKey = ''

            if (newIndex === this.player!.bottomOrder.length - 1) {
                this.lastChange = 'bottomRight'
                return
            }

            this.lastChange = (newIndex > old || newIndex === 0) ? 'bottomLeft' : 'bottomRight'
        },

        'player.topIndex': function resetChoices(newIndex, old) {
            if (!this.player!.topOrder) return

            this.chosenKey = ''
            this.isSubmitting = false
            this.lastSubmittedKey = ''

            if (newIndex === this.player!.topOrder.length - 1) {
                this.lastChange = 'topRight'
                return
            }

            this.lastChange = (newIndex > old || newIndex === 0) ? 'topLeft' : 'topRight'
        },

        'player.interactionId': function resetChoices() {
            this.chosenKey = ''
            this.isSubmitting = false
            this.lastSubmittedKey = ''
        }
    },

    mounted() {
        this.throttledSubmitVote = throttle(this.submitVote.bind(this), 400)
    },

    beforeUnmount() {
        this.throttledSubmitVote?.cancel()
    },

    methods: {
        async voteClicked(event: Event, index: number) {
            if (event.target instanceof HTMLElement) {
                event.target.blur()
            }
            const key = this.player!.countGroupChoices ? `${this.player!.countGroupChoices[index]}` : `${index}`
            if (key === this.chosenKey) return
            this.chosenKey = key
            if (this.throttledSubmitVote) return this.throttledSubmitVote()
        },
        async submitVote() {
            if (!this.player!.countGroupName) {
                console.error('Missing count group key for vote session')
            }
            const { chosenKey, lastSubmittedKey } = this
            if (chosenKey === this.lastSubmittedKey) return

            this.isSubmitting = true

            try {
                await this.$ecast.incrementCountGroupCounter(this.player!.countGroupName, chosenKey)
                this.lastSubmittedKey = chosenKey

                if (!this.player!.countGroupNegativeName) return
                if (lastSubmittedKey !== '') {
                    void this.$ecast.incrementCountGroupCounter(this.player!.countGroupNegativeName, lastSubmittedKey)
                        .catch(this.$handleEcastError)
                }
            } catch (err) {
                // Ignore rate limit exceeded for now
                if (!(err instanceof EcastRateLimitExceeded)) {
                    this.$handleEcastError(err)
                }
            }
            this.isSubmitting = false
        }
    }
})
</script>

<style scoped lang="scss">
.flipping {
    background-image: url('../images/DrawingStripesTile.png');
    overflow-x: hidden;

    .constrain {
        padding: 20px 0;
    }

    .flipchart {
        overflow: visible;

        .row {
            position: relative;
            .carousel {
                margin: 0 -40%;
                display: flex;
                flex-flow: row nowrap;
                > div {
                    flex: 1 0 auto;
                    margin: 0px 5px;
                }
                &.slide-left {
                    animation: slideLeft 0.5s ease-out 0s;
                    animation-iteration-count: 1;
                }
                &.slide-right {
                    animation: slideRight 0.5s ease-out 0s;
                    animation-iteration-count: 1;
                }
            }

            .circle-button {
                background-color: transparent;
                background-image: url("../images/ArrowBttnOff.svg");
                background-repeat: no-repeat;
                background-position: center;
                background-size: contain;
                border-radius: 25px;
                border: 0px solid transparent;
                height: 50px;
                width: 50px;
                position: absolute;
                top: 40%;
                &.left {
                    right: 15%;
                    transform: rotate(180deg);
                }
                &.right {
                    left: 15%;
                }
                &.selected {
                    background-image: url("../images/ArrowBttnOn.svg");
                }
            }
        }
    }

    .timer {
        margin-top: 25px;
        border-image: url("../images/TimerBG.svg") 9 fill;
        border-width: 9px;
        border-style: solid;
        background-clip: padding-box;
        height: 42px;
        background-color: black;
        .timer-bar {
            background-color: #ff28b7;
            display: block;
            height: 100%;
            position: relative;
            overflow: hidden;
        }
    }

    .owl {
        height: 150px;
        background-color: white;
        background-size: contain;
        background-repeat: no-repeat;
        border: 6px solid black;
    }

    .owl-complete {
        height: 300px;
        background-color: white;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        border: 6px solid black;
    }

    .carousel.top .owl {
        background-position: center bottom;
        border-top-left-radius: 3px;
        border-top-right-radius: 3px;
        border-bottom-width: 0px;
    }
    .carousel.bottom .owl {
        border-bottom-left-radius: 3px;
        border-bottom-right-radius: 3px;
    }

    .OwlTop_00 { background-image: url("../images/Owls/OwlTop_00.png"); }
    .OwlTop_01 { background-image: url("../images/Owls/OwlTop_01.png"); }
    .OwlTop_02 { background-image: url("../images/Owls/OwlTop_02.png"); }
    .OwlTop_03 { background-image: url("../images/Owls/OwlTop_03.png"); }
    .OwlTop_04 { background-image: url("../images/Owls/OwlTop_04.png"); }
    .OwlTop_05 { background-image: url("../images/Owls/OwlTop_05.png"); }
    .OwlTop_06 { background-image: url("../images/Owls/OwlTop_06.png"); }
    .OwlTop_07 { background-image: url("../images/Owls/OwlTop_07.png"); }
    .OwlTop_08 { background-image: url("../images/Owls/OwlTop_08.png"); }
    .OwlTop_09 { background-image: url("../images/Owls/OwlTop_09.png"); }
    .OwlTop_10 { background-image: url("../images/Owls/OwlTop_10.png"); }
    .OwlTop_11 { background-image: url("../images/Owls/OwlTop_11.png"); }
    .OwlTop_12 { background-image: url("../images/Owls/OwlTop_12.png"); }
    .OwlTop_13 { background-image: url("../images/Owls/OwlTop_13.png"); }
    .OwlTop_14 { background-image: url("../images/Owls/OwlTop_14.png"); }
    .OwlTop_15 { background-image: url("../images/Owls/OwlTop_15.png"); }
    .OwlTop_16 { background-image: url("../images/Owls/OwlTop_16.png"); }
    .OwlTop_17 { background-image: url("../images/Owls/OwlTop_17.png"); }
    .OwlTop_18 { background-image: url("../images/Owls/OwlTop_18.png"); }
    .OwlTop_19 { background-image: url("../images/Owls/OwlTop_19.png"); }
    .OwlTop_20 { background-image: url("../images/Owls/OwlTop_20.png"); }
    .OwlTop_21 { background-image: url("../images/Owls/OwlTop_21.png"); }
    .OwlTop_22 { background-image: url("../images/Owls/OwlTop_22.png"); }
    .OwlTop_23 { background-image: url("../images/Owls/OwlTop_23.png"); }
    .OwlTop_24 { background-image: url("../images/Owls/OwlTop_24.png"); }
    .OwlTop_25 { background-image: url("../images/Owls/OwlTop_25.png"); }
    .OwlTop_26 { background-image: url("../images/Owls/OwlTop_26.png"); }
    .OwlTop_27 { background-image: url("../images/Owls/OwlTop_27.png"); }
    .OwlTop_28 { background-image: url("../images/Owls/OwlTop_28.png"); }
    .OwlTop_29 { background-image: url("../images/Owls/OwlTop_29.png"); }
    .OwlTop_30 { background-image: url("../images/Owls/OwlTop_30.png"); }
    .OwlTop_31 { background-image: url("../images/Owls/OwlTop_31.png"); }

    .OwlBttm_00 { background-image: url("../images/Owls/OwlBttm_00.png"); }
    .OwlBttm_01 { background-image: url("../images/Owls/OwlBttm_01.png"); }
    .OwlBttm_02 { background-image: url("../images/Owls/OwlBttm_02.png"); }
    .OwlBttm_03 { background-image: url("../images/Owls/OwlBttm_03.png"); }
    .OwlBttm_04 { background-image: url("../images/Owls/OwlBttm_04.png"); }
    .OwlBttm_05 { background-image: url("../images/Owls/OwlBttm_05.png"); }
    .OwlBttm_06 { background-image: url("../images/Owls/OwlBttm_06.png"); }
    .OwlBttm_07 { background-image: url("../images/Owls/OwlBttm_07.png"); }
    .OwlBttm_08 { background-image: url("../images/Owls/OwlBttm_08.png"); }
    .OwlBttm_09 { background-image: url("../images/Owls/OwlBttm_09.png"); }
    .OwlBttm_10 { background-image: url("../images/Owls/OwlBttm_10.png"); }
    .OwlBttm_11 { background-image: url("../images/Owls/OwlBttm_11.png"); }
    .OwlBttm_12 { background-image: url("../images/Owls/OwlBttm_12.png"); }
    .OwlBttm_13 { background-image: url("../images/Owls/OwlBttm_13.png"); }
    .OwlBttm_14 { background-image: url("../images/Owls/OwlBttm_14.png"); }
    .OwlBttm_15 { background-image: url("../images/Owls/OwlBttm_15.png"); }
    .OwlBttm_16 { background-image: url("../images/Owls/OwlBttm_16.png"); }
    .OwlBttm_17 { background-image: url("../images/Owls/OwlBttm_17.png"); }
    .OwlBttm_18 { background-image: url("../images/Owls/OwlBttm_18.png"); }
    .OwlBttm_19 { background-image: url("../images/Owls/OwlBttm_19.png"); }
    .OwlBttm_20 { background-image: url("../images/Owls/OwlBttm_20.png"); }
    .OwlBttm_21 { background-image: url("../images/Owls/OwlBttm_21.png"); }
    .OwlBttm_22 { background-image: url("../images/Owls/OwlBttm_22.png"); }
    .OwlBttm_23 { background-image: url("../images/Owls/OwlBttm_23.png"); }
    .OwlBttm_24 { background-image: url("../images/Owls/OwlBttm_24.png"); }
    .OwlBttm_25 { background-image: url("../images/Owls/OwlBttm_25.png"); }
    .OwlBttm_26 { background-image: url("../images/Owls/OwlBttm_26.png"); }
    .OwlBttm_27 { background-image: url("../images/Owls/OwlBttm_27.png"); }
    .OwlBttm_28 { background-image: url("../images/Owls/OwlBttm_28.png"); }
    .OwlBttm_29 { background-image: url("../images/Owls/OwlBttm_29.png"); }
    .OwlBttm_30 { background-image: url("../images/Owls/OwlBttm_30.png"); }
    .OwlBttm_31 { background-image: url("../images/Owls/OwlBttm_31.png"); }

    .OwlComplete_00 { background-image: url("../images/Owls/OwlComplete_00.png"); }
    .OwlComplete_01 { background-image: url("../images/Owls/OwlComplete_01.png"); }
    .OwlComplete_02 { background-image: url("../images/Owls/OwlComplete_02.png"); }
    .OwlComplete_03 { background-image: url("../images/Owls/OwlComplete_03.png"); }
    .OwlComplete_04 { background-image: url("../images/Owls/OwlComplete_04.png"); }
    .OwlComplete_05 { background-image: url("../images/Owls/OwlComplete_05.png"); }
    .OwlComplete_06 { background-image: url("../images/Owls/OwlComplete_06.png"); }
    .OwlComplete_07 { background-image: url("../images/Owls/OwlComplete_07.png"); }
    .OwlComplete_08 { background-image: url("../images/Owls/OwlComplete_08.png"); }
    .OwlComplete_09 { background-image: url("../images/Owls/OwlComplete_09.png"); }
    .OwlComplete_10 { background-image: url("../images/Owls/OwlComplete_10.png"); }
    .OwlComplete_11 { background-image: url("../images/Owls/OwlComplete_11.png"); }
    .OwlComplete_12 { background-image: url("../images/Owls/OwlComplete_12.png"); }
    .OwlComplete_13 { background-image: url("../images/Owls/OwlComplete_13.png"); }
    .OwlComplete_14 { background-image: url("../images/Owls/OwlComplete_14.png"); }
    .OwlComplete_15 { background-image: url("../images/Owls/OwlComplete_15.png"); }
    .OwlComplete_16 { background-image: url("../images/Owls/OwlComplete_16.png"); }
    .OwlComplete_17 { background-image: url("../images/Owls/OwlComplete_17.png"); }
    .OwlComplete_18 { background-image: url("../images/Owls/OwlComplete_18.png"); }
    .OwlComplete_19 { background-image: url("../images/Owls/OwlComplete_19.png"); }
    .OwlComplete_20 { background-image: url("../images/Owls/OwlComplete_20.png"); }
    .OwlComplete_21 { background-image: url("../images/Owls/OwlComplete_21.png"); }
    .OwlComplete_22 { background-image: url("../images/Owls/OwlComplete_22.png"); }
    .OwlComplete_23 { background-image: url("../images/Owls/OwlComplete_23.png"); }
    .OwlComplete_24 { background-image: url("../images/Owls/OwlComplete_24.png"); }
    .OwlComplete_25 { background-image: url("../images/Owls/OwlComplete_25.png"); }
    .OwlComplete_26 { background-image: url("../images/Owls/OwlComplete_26.png"); }
    .OwlComplete_27 { background-image: url("../images/Owls/OwlComplete_27.png"); }
    .OwlComplete_28 { background-image: url("../images/Owls/OwlComplete_28.png"); }
    .OwlComplete_29 { background-image: url("../images/Owls/OwlComplete_29.png"); }
    .OwlComplete_30 { background-image: url("../images/Owls/OwlComplete_30.png"); }
    .OwlComplete_31 { background-image: url("../images/Owls/OwlComplete_31.png"); }
}

@keyframes slideLeft {
  from {
    transform: translateX(33%);
  }

  to {
    transform: translateX(0%)
  }
}
@keyframes slideRight {
  from {
    transform: translateX(-33%);
  }

  to {
    transform: translateX(0%)
  }
}
</style>
