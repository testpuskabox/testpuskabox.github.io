<template>
<div class="writing">
    <div class="header" v-text="player!.header" />
    <div class="constrain">
        <p v-if="isSubmitted" v-t="'WRITING.DONE'" />
        <form v-else v-on:submit.prevent="onSubmit">
            <fieldset :disabled="isSubmitting">
                <label for="text-input">
                    <p class="prompt" v-text="prompt" />
                </label>
                <textarea
                    id="text-input"
                    ref="textarea"
                    rows="1"
                    :maxlength="player!.maxLength"
                    :placeholder="player!.placeholder"
                    :value="answer"
                    v-on:input="onInput"
                    v-on:keypress="onKeypress"
                />
                <div v-if="player!.isFriendMode" v-t="'WRITING.FRIEND_HINT'" class="friend-hint" />
                <div v-if="player!.error" class="error">{{ player!.error }}</div>
                <div v-if="filterError" class="error">{{ $t('WRITING.FILTER_ERROR') }}</div>
                <div class="controls">
                    <div class="remaining" v-text="remainingCharacters" />
                    <button
                        class="submit"
                        type="submit"
                        value="Submit"
                        :disabled="!hasAnswer"
                    >
                        {{ submitText }}
                    </button>
                </div>
            </fieldset>
        </form>
    </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { DebouncedFunc, throttle } from 'lodash'
import autosize from 'autosize' // TODO: can we use the shared textarea?
import { EcastFilterError } from '@jackboxgames/ecast/errors'
import { Utils } from '@tv/shared'
import type { DrawfulAnimate } from '../DrawfulAnimate'

type AutoSubmitter = DebouncedFunc<() => Promise<void>>

export default defineComponent({
    props: {
        player: Object as Prop<DrawfulAnimate.Writing.Entity>,
        audience: Boolean
    },

    data() {
        return {
            answer: '',
            filterError: false,
            isSubmitting: false,
            isSubmitted: false,
            autoSubmitter: <AutoSubmitter|undefined> undefined
        }
    },

    computed: {
        sanitizedAnswer(): string {
            return Utils.sanitizeInput(this.answer).trim()
        },

        prompt(): string {
            return this.player!.prompt || this.$t('WRITING.PROMPT')
        },

        remainingCharacters(): string {
            if (!this.player!.maxLength) return ''
            if (!this.answer) return ''
            return `${this.player!.maxLength - this.answer.length}`
        },

        canSubmit(): boolean {
            if (!this.sanitizedAnswer) return false
            if (this.player!.maxLength && this.sanitizedAnswer.length > this.player!.maxLength) return false

            return true
        },

        submitText(): string {
            return this.player!.submitText || this.$t('WRITING.BUTTON_SUBMIT')
        },

        hasAnswer(): boolean {
            return this.answer?.trim().length > 0
        }
    },

    watch: {
        'player.writingId': function resetWriting() {
            if (!this.player!.error) this.answer = ''
            this.isSubmitting = false
        }
    },

    mounted() {
        this.autoSubmitter = throttle(this.autoSubmit.bind(this), 400)
        autosize(this.$refs.textarea as HTMLElement)

        if (this.player!.textKey) {
            void this.restoreText()
        }
    },

    beforeUnmount() {
        this.autoSubmitter?.cancel()
    },

    methods: {
        async restoreText() {
            try {
                const textEntity = await this.$ecast.getText(this.player!.textKey)
                this.answer = textEntity.text
            } catch (error) {
                this.$handleEcastError(error)
            }
        },

        async autoSubmit() {
            if (!this.isSubmitting) {
                try {
                    await this.$ecast.updateText(this.player!.textKey, this.sanitizedAnswer)
                } catch (err) {
                    if (!(err instanceof EcastFilterError)) {
                        this.$handleEcastError(err)
                    }
                    // Do not set filterError here
                    // Erase the existing stuff, which likely has all but one letter of a swear
                    void this.$ecast.updateText(this.player!.textKey, '').catch(this.$handleEcastError)
                }
            }
        },

        onKeypress(event: KeyboardEvent) {
            if (event.key === 'Enter') {
                void this.onSubmit()
            }
        },

        onInput(event: Event) {
            const target = event.target as HTMLTextAreaElement
            const maxLength = this.player!.maxLength || Number.MAX_SAFE_INTEGER

            if (target.value.length > maxLength) {
                target.value = target.value.substring(0, maxLength)
            }

            // sanitize
            target.value = Utils.sanitizeInput(target.value)

            this.answer = target.value
            this.filterError = false
            if (this.player!.responseKey && this.autoSubmitter) {
                void this.autoSubmitter()
            }
        },

        async onSubmit() {
            this.isSubmitting = true
            if (!this.audience) {
                try {
                    await this.$ecast.getText(this.player!.textKey)
                    await this.$ecast.updateText(this.player!.textKey, this.sanitizedAnswer)
                    this.filterError = false
                    // Autosubmit
                    if (this.player!.responseKey) {
                        try {
                            await this.$ecast.updateObject(this.player!.responseKey, {
                                answer: this.sanitizedAnswer,
                                done: true
                            })
                        } catch (error) {
                            this.$handleEcastError(error)
                        }
                    }
                } catch (err) {
                    if (!(err instanceof EcastFilterError)) {
                        this.$handleEcastError(err)
                    }
                    this.filterError = true
                    this.isSubmitting = false
                    setTimeout(() => {
                        if (this.$refs.textarea instanceof HTMLElement) {
                            this.$refs.textarea.focus()
                        }
                    }, 0)
                }
            } else {
                try {
                    if (this.player!.textRingName) {
                        await this.$ecast.pushTextRing(this.player!.textRingName, this.sanitizedAnswer)
                        this.isSubmitted = true
                    }
                } catch (err) {
                    this.$handleEcastError(err)
                }
            }
        }
    }
})
</script>

<style lang="scss">
@use '../styles/vars.scss' as drawful;

.writing {
    background-image: url('../images/DrawingStripesTile.png');
    text-align: center;

    .friend-hint {
        margin-bottom: 5px;
        font-size: 14px;
        opacity: 0.5;
    }

    .error {
        margin-bottom: 5px;
        font-size: 18px;
        color: drawful.$error;
    }

    .controls {
        .remaining {
            margin-left: 16px;
            float: left;
        }

        button.submit {
            float: right;
            margin-right: 16px;
            font-size: 18px;
            color: white;
            background-clip: padding-box;
            background-color: black;
            border-width: 7px;
            border-style: solid;
            border-image: url(../images/AnswerChoiceButton.svg) 3 fill;

            &:active:not(:disabled) {
                color: black;
                background-color: white;
                border-image: url(../images/AnswerChoiceButtonActive.svg) 3 fill;
            }
            &:disabled {
                opacity: 0.3;
            }
        }
    }
}
</style>
