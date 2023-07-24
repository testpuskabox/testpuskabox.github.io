<template>
<div
    class="choosing scrollable"
    :class="{
        liking: liking,
        'doubling-down': player!.doubleDown
    }"
>
    <div class="header" v-text="header" />
    <div class="constrain">
        <div v-if="player!.doubleDown" class="doubleDown">
            <div class="doubleDownPrompt" v-text="player!.doubleDown.prompt" />
            <button
                class="choice"
                :class="player!.doubleDown.status"
                :disabled="player!.doubleDown.status !== 'available'"
                v-on:click.prevent="onDoubleDownClick"
            >
                {{ $t('CHOOSING.DOUBLEDOWN_TEXT') }}
                <span
                    v-if="player!.doubleDown.status === 'used'"
                    class="subheader"
                >{{ $t('CHOOSING.DOUBLEDOWN_USED') }}</span>
                <span
                    v-else-if="player!.doubleDown.frequency === 'round'"
                    class="subheader"
                >{{ $t('CHOOSING.DOUBLEDOWN_PER_ROUND') }}</span>
                <span
                    v-else-if="player!.doubleDown.frequency === 'game'"
                    class="subheader"
                >{{ $t('CHOOSING.DOUBLEDOWN_PER_GAME') }}</span>
            </button>
        </div>
        <div class="prompt" v-text="player!.prompt" />
        <div class="choices">
            <button
                v-for="(choice, index) in player!.choices"
                :key="`choice_${player!.choiceId}_${index}`"
                class="choice"
                :class="{
                    'buttonBlack': !liking,
                    chosen: submittedActions.choose === index,
                    selected: choice.selected
                }"
                :disabled="choice.disabled || submittedActions.choose !== -1"
                v-on:click.prevent="submitVote($event, index, 'choose')"
            >
                <span class="text" v-text="choice.text" />
            </button>
        </div>
        <div v-if="player!.speedIndex !== undefined" class="track">
            <div class="track-image-container" :class="`speed-${player!.speedIndex}`">
                <img src="../images/SpeedSlider.svg" class="track-image" :alt="`speed ${player!.speedIndex}`">
            </div>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { EcastRateLimitExceeded } from '@jackboxgames/ecast/errors'
import type { DrawfulAnimate } from '../DrawfulAnimate'

type Action = 'choose' | 'doubleDown'

export default defineComponent({
    props: {
        player: Object as Prop<DrawfulAnimate.Choosing.Entity>,
        audience: Boolean,
        liking: Boolean
    },

    data() {
        return {
            chosenIndex: -1,
            rateLimited: false,
            submittedActions: {
                choose: -1,
                doubleDown: -1
            } as Record<Action, number>
        }
    },

    computed: {
        header(): string {
            if (this.player!.header) return this.player!.header
            return this.$ecast.name
        }
    },

    watch: {
        'player.choiceId': function resetChoices() {
            const el = this.$el.querySelector(':hover')
            if (el && el instanceof HTMLElement) el.blur()

            this.submittedActions.choose = -1
            this.chosenIndex = -1
        }
    },

    methods: {
        onDoubleDownClick() {
            if (!this.player!.doubleDown || !this.player!.doubleDown.responseKey) {
                console.error('Missing doubleDown responseKey')
            }

            void this.$ecast.updateObject<DrawfulAnimate.Choosing.Response>(this.player!.doubleDown!.responseKey, {
                action: 'doubleDown',
                choice: 0
            }).catch(this.$handleEcastError)
        },
        async submitVoteAudience(index: number, action: Action) {
            if (this.audience && !this.player!.countGroupName) {
                console.error('Missing count group name')
            }

            this.submittedActions[action] = index

            if (this.rateLimited) return
            const key = (this.player!.choices[index].countGroupKey !== undefined)
                ? this.player!.choices[index].countGroupKey
                : `${index}`

            try {
                await this.$ecast.incrementCountGroupCounter(this.player!.countGroupName, key)
            } catch (err) {
                if (!(err instanceof EcastRateLimitExceeded)) {
                    this.$handleEcastError(err)
                }
                // Disable the buttons for a few seconds
                this.rateLimited = true
                setTimeout(() => {
                    this.rateLimited = false
                }, 1000)
            }
        },
        async submitVote(event: Event, index: number, action: Action) {
            if (event.target instanceof HTMLElement) {
                event.target.blur()
            }
            if (this.audience) {
                return this.submitVoteAudience(index, action)
            }
            if (!this.audience && !this.player!.responseKey) {
                console.error('Missing response entity for vote session')
            }

            this.submittedActions[action] = index

            const key = this.player!.choices[index].key !== undefined
                ? this.player!.choices[index].key
                : index // Can be a number

            void this.$ecast.updateObject<DrawfulAnimate.Choosing.Response>(this.player!.responseKey, {
                action,
                choice: key
            }).catch(this.$handleEcastError)
        }
    }
})
</script>

<style lang="scss">
.choosing {
    background-image: url('../images/DrawingStripesTile.png');

    .choices {
        .choice {
            padding: 5px 0;
            border: 7px solid black;
            border-image: url("../images/AnswerChoiceButton.svg") 7 7 fill;
            border-image-repeat: inherit;
            cursor: pointer;
            margin: 6px 0;
            width: 100%;
            min-height: 48px;
            font-size: 18px;
            background-clip: padding-box;
            background-color: black;
            color: white;

            &:disabled {
                cursor:not-allowed;
            }

            &:active:not(:disabled), &.chosen {
                border-image: url("../images/AnswerChoiceButtonActive.svg") 7 7 fill;
                background-color: white;
                color: black;
            }

            .drawing {
                width: 20%;
                height: auto;
            }

            .text {
                display: block;
                position: relative;
            }
        }
    }

    .track-image-container {
        width: 75%;
        position: relative;
        margin: 50px auto 0px auto;
        &::after {
            content: "";
            position: absolute;
            width: 50px;
            height: 50px;
            transform: translateX(-50%);
            top: -13%;
            left: 50%;
            background-image: url("../images/SliderCircle.svg");
            background-repeat: no-repeat;
            background-size: contain;
            background-position: center;
            transition: left 0.15s;
        }
        &.speed-0::after { left: 12%; }
        &.speed-1::after { left: 31%; }
        &.speed-2::after { left: 50%; }
        &.speed-3::after { left: 69%; }
        &.speed-4::after { left: 88%; }
    }
}
.choosing.doubling-down,
.choosing.liking {
    .prompt {
        color: black;
        margin-top:15px;
        text-transform: lowercase;
        padding: 10px 0px;
        position: relative;
        &::before {
            content: '';
            width: 100%;
            height: 10px;
            position: absolute;
            top: 0;
            left: 0;
            background-image: url("../images/HeaderLine.svg");
            background-repeat: no-repeat;
            background-size: 100% 100%;
        }
        &::after {
            content: '';
            width: 100%;
            height: 10px;
            position: absolute;
            bottom: 0;
            left: 0;
            background-image: url("../images/HeaderLine.svg");
            background-repeat: no-repeat;
            background-size: 100% 100%;
        }
    }

    .choices {
        padding: 5px 10%;
        .choice {
            color: black;
            text-align: left;
            border: 0px solid transparent;
            border-image: none;
            background-color: transparent;
            padding-left: 45px;
            background-image: url("../images/CheckboxOff.png");
            background-position: center left;
            background-repeat: no-repeat;
            background-size: 44px;
            &.selected, &.chosen {
                background-image: url("../images/CheckboxOn.png");
            }

            &:active:not(:disabled), &.chosen {
                color: white;
                background-color: transparent;
                border-image: none;
            }

        }
    }

    .doubleDown {
        .doubleDownPrompt {
            word-break: break-word;
            background-clip: padding-box;
            background-color:black;
            border: 7px solid black;
            border-image: url("../images/AnswerChoiceButton.svg") 7 7 fill;
            border-image-repeat: inherit;
            color: white;
        }
        .subheader {
            display: block;
            font-size: 0.5em;
        }

        button {
            margin-top: 20px;
            padding-right: 45px;
            border: none;
            font-size: 26px;
            color: black;
            background: none;
            background-image: url("../images/CheckboxOff_DD.png");
            background-position: center right;
            background-repeat: no-repeat;
            background-size: 40px;
            overflow: visible;

            &.active, &.chosen {
                background-image: url("../images/CheckboxOn_DD.png");
            }

            &.used, &.inactive, &.chosen {
                opacity: 0.25;
            }
        }

        .info {
            font-size: 15px;
            opacity: 0.5;
        }
    }
}
</style>
