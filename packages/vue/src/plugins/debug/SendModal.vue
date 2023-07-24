<template>
<div class="jbg">
    <div v-if="screen === 'options'" class="options">
        <button class="feedback-button" v-on:click="onFeedbackClick">
            <img src="./star.png" alt="Leave Feedback">
            <span>LEAVE<br>FEEDBACK</span>
        </button>
        <button v-on:click="onDebugClick">
            <img src="./kitten.png" alt="Send Debug">
            <span>SEND A<br>DEBUG</span>
        </button>
    </div>

    <div v-else-if="screen === 'feedback'" class="feedback">
        <img class="image" src="./star.png" alt="Feedback">
        <h3 class="text">Send Feedback</h3>
        <div class="vibes" :class="{ 'has-selected': vibe }">
            <p class="cta">CHOOSE A VIBE</p>
            <div class="buttons">
                <button :class="{ selected: vibe === 'good' }" v-on:click="onVibeClick('good')">
                    <img src="./good.png" alt="good">
                </button>
                <button :class="{ selected: vibe === 'meh' }" v-on:click="onVibeClick('meh')">
                    <img src="./meh.png" alt="good">
                </button>
                <button :class="{ selected: vibe === 'bad' }" v-on:click="onVibeClick('bad')">
                    <img src="./bad.png" alt="bad">
                </button>
            </div>
        </div>
        <div class="actions">
            <div v-if="content" class="content-guess">
                <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
                <input v-model="isContent" type="checkbox">
                <span>Feedback is about: <em>{{ content }}</em></span>
            </div>
            <textarea
                v-model="message"
                rows="3"
                placeholder="(optional) more details"
                aria-label="Details"
            />
            <button v-on:click.prevent="onSubmitClick">{{ $t('ACTION.SUBMIT') }}</button>
        </div>
    </div>

    <div v-else-if="screen === 'debug'" class="debug">
        <img class="image" src="./kitten.png" alt="Debug">
        <h3 class="text">What is Happening?</h3>
        <div class="actions">
            <textarea
                v-model="message"
                rows="3"
                placeholder="Enter details"
                aria-label="Details"
            />
            <button v-on:click.prevent="onSubmitClick">{{ $t('ACTION.OK') }}</button>
        </div>
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import cloneDeep from 'lodash/cloneDeep'
import { FeedbackSender } from '@tv/shared'

type Screen = 'options' | 'debug' | 'feedback'

export default defineComponent({
    emits: {
        resolve: () => true
    },

    data() {
        return {
            screen: <Screen> 'options',
            vibe: <FeedbackSender.Vibe|null> null,
            message: '',
            content: <string|null> null,
            isContent: true,
            values: <Record<string, any>> {}
        }
    },

    mounted() {
        const tag = this.$debugRecorder?.room?.appTag
        if (!tag) return
        this.values = cloneDeep(this.$ecastValues)
        this.content = FeedbackSender.getPromptGuess(this.values, tag) ?? null
    },

    methods: {
        onFeedbackClick() {
            this.screen = 'feedback'
        },

        onDebugClick() {
            this.screen = 'debug'
        },

        onVibeClick(vibe: FeedbackSender.Vibe) {
            this.vibe = vibe
        },

        async onSubmitClick() {
            if (!this.$debugRecorder) return

            if (this.screen === 'debug') {
                await this.$debugRecorder.send(this.message)
                this.$emit('resolve')
            }

            if (this.screen === 'feedback') {
                await FeedbackSender.send({
                    room: this.$debugRecorder.room!,
                    name: this.$ecast.name,
                    role: this.$ecast.role,
                    content: this.isContent ? this.content : null,
                    message: this.message ?? '',
                    vibe: this.vibe ?? 'none',
                    values: this.values
                })

                this.$emit('resolve')
            }
        }
    }
})
</script>


<style lang="scss" scoped>
@use '@tv/shared/src/styles/jbg.scss' as jbg;

.jbg.content .options {
    button {
        display: inline-block;
        width: 46%;
        height: auto;
        margin: 0;
        padding: 10px 10px 20px;
        background: transparent;
        color: jbg.$grayDark;
        font-size: 15px;
        line-height: 1.2;
        border: 1px solid jbg.$offWhite;
    }

    .feedback-button {
        margin-right: 6%;
    }

    img {
        width: 80%;
        padding-bottom: 5px;
    }
}

.jbg.content .feedback {
    .text {
        margin-top: 0;
    }

    textarea {
        text-transform: none;
    }

    .vibes {
        position: relative;
        padding: 6px 10px 10px;
        margin-top: 10px;
        border: 2px solid jbg.$offWhite;
        border-radius: 10px;

        .cta {
            font-weight: bold;
        }

        .buttons {
            display: flex;
        }

        button {
            height: auto;
            background: transparent;
            box-shadow: none;

            img {
                width: 80%;
            }
        }

        &.has-selected {
            button {
                opacity: 0.25;
            }

            button.selected {
                opacity: 1;
            }
        }
    }

    .content-guess {
        text-align: left;

        input {
            display: inline-block;
            width: 20px;
            margin: 0 10px 0 0;
            vertical-align: middle;
        }
    }
}

.jbg.content .debug {
    textarea {
        text-transform: none;
    }
}
</style>
