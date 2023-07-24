<template>
<div id="controller" class="ugc scrollable">
    <div class="header" v-text="ugcHeader" />
    <div class="constrain">
        <div v-if="player!.validActions.length === 0" v-text="player!.noActionsText" />
        <div v-if="player!.validActions.includes('toggle-visibility')" class="ugc-action ugc-action-toggle-visibility">
            <span class="text toggle_prompts_prompt">{{ $t('UGC.TOGGLE_PROMPTS_PROMPT') }}</span><br>
            <button
                id="ugc-toggle-visibility-button-controller"
                :class="{
                    on: player!.controllerVisibility
                }"
                class="ugc-toggle-visibility-button ugc-toggle-visibility-button-controller"
                data-target="controller"
                v-on:click.prevent="onToggleVisibility('controller')"
            />
            <button
                id="ugc-toggle-visibility-button-screen"
                :class="{
                    on: player!.screenVisibility
                }"
                class="ugc-toggle-visibility-button  ugc-toggle-visibility-button-screen"
                data-target="screen"
                v-on:click.prevent="onToggleVisibility('screen')"
            />
        </div>
        <div v-if="player!.validActions.includes('play')" class="ugc-action ugc-action-play">
            <div class="ugc-episode-name" />
        </div>
        <div v-if="player!.validActions.includes('new')" class="ugc-action ugc-action-new">
            <button
                id="ugc-new-button"
                class="button action-button create_new_episode"
                type="button"
                v-on:click.prevent="onActionButtonClicked('new')"
            >
                {{ $t('UGC.CREATE_NEW_EPISODE') }}
            </button>
        </div>

        <div v-if="player!.validActions.includes('load')" class="ugc-action ugc-action-load">
            <p class="ugc-option text-box ugc-load previous_episodes">{{ $t('UGC.PREVIOUS_EPISODES') }}</p>
            <div id="episodesRegion">
                <div class="episodesList">
                    <div
                        v-for="(episode, index) in player!.episodes"
                        :key="episode.remoteContentId || episode.localContentId"
                    >
                        <button
                            class="action-button"
                            v-on:click.prevent="onEpisodeClick(index)"
                        >
                            <span v-text="episode.metadata.title" />
                            <span
                                v-if="episode.remoteContentId !== null"
                                class="episodeId"
                                v-text="episode.formattedRemoteContentId"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="player!.text" id="prompt" :v-text="player!.text" class="prompt ugc-text" />
        <div v-if="player!.validActions.length === 0" id="ugc-no-actions">
            <div id="ugc-no-actions-text" />
        </div>

        <div v-if="player!.validActions.includes('add')" class="ugc-action ugc-action-add">
            <div id="toggleRegion" />
            <div id="inputRegion">
                <div class="promptInput">
                    <div>{{ promptCharacterCount }}</div>
                    <textarea
                        id="promptTextarea"
                        ref="promptTextarea"
                        aria-label="add a prompt"
                        rows="1"
                        :value="answer"
                        :maxlength="player!.maxContentLength"
                        :placeholder="$t('UGC.INPUT_PLACEHOLDER')"
                        v-on:input="onInput"
                        v-on:keypress="onKeypress($event, 'prompt')"
                    />
                    <button
                        class="buttonBlack createButton"
                        :disabled="player!.count === player!.maxCount"
                        v-on:click.prevent="createNewPrompt"
                    >
                        {{ $t('UGC.BUTTON_ADD') }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="player!.validActions.includes('title')" class="ugc-action ugc-action-title">
            <label for="textinput" class="text-box">
                <span class="text create_new_name_prompt">{{ $t('UGC.CREATE_NEW_NAME_PROMPT') }}</span>
            </label>
            <div class="titleInput">
                <div>{{ titleCharacterCount }}</div>
                <textarea
                    id="titleTextarea"
                    ref="titleTextarea"
                    rows="1"
                    :value="answer"
                    :maxlength="player!.maxTitleLength"
                    :placeholder="$t('UGC.TITLE_INPUT_PLACEHOLDER')"
                    v-on:input="onInput"
                    v-on:keypress="onKeypress($event, 'title')"
                />
                <button
                    class="buttonBlack createButton"
                    v-on:click.prevent="createNewEpisode"
                >
                    {{ $t('UGC.CREATE_NEW_BUTTON') }}
                </button>
            </div>
        </div>

        <div v-if="player!.validActions.includes('close')" class="ugc-action ugc-action-close">
            <button
                class="button action-button button_close"
                v-on:click.prevent="onActionButtonClicked('close')"
            >
                {{ $t('UGC.BUTTON_CLOSE') }}
            </button>
        </div>
        <div v-if="player!.validActions.includes('unlock')" class="ugc-action ugc-action-unlock">
            <button
                class="button action-button button_edit"
                v-on:click.prevent="onActionButtonClicked('unlock')"
            >
                {{ $t('UGC.BUTTON_EDIT') }}
            </button>
        </div>
        <div v-if="player!.validActions.includes('done')" class="ugc-action ugc-action-done">
            <button
                class="button action-button button_done"
                v-on:click.prevent="onActionButtonClicked('done')"
            >
                {{ $t('UGC.BUTTON_DONE') }}
            </button>
        </div>
        <div v-if="player!.validActions.includes('submit')" class="ugc-action ugc-action-submit">
            <button
                class="button action-button button_publish"
                v-on:click.prevent="showTermsOfService"
            >
                {{ $t('UGC.BUTTON_PUBLISH') }}
            </button>
        </div>

        <div v-if="player!.validActions.includes('play')" class="ugc-action ugc-action-play">
            <button
                class="button action-button button_play"
                v-on:click.prevent="onActionButtonClicked('play')"
            >
                {{ $t('UGC.BUTTON_PLAY') }}
            </button>
        </div>

        <div v-if="player!.validActions.includes('remove-content')" class="ugc-action ugc-action-remove-content">
            <button
                class="button action-button button_delete"
                v-on:click.prevent="showConfirmDeleteDialog"
            >
                {{ $t('UGC.BUTTON_DELETE') }}
            </button>
        </div>

        <div v-if="player!.validActions.includes('exit')" class="ugc-action ugc-action-exit">
            <button
                class="button action-button button_back_to_menu"
                v-on:click.prevent="onActionButtonClicked('exit')"
            >
                {{ $t('UGC.BUTTON_BACK_TO_MENU') }}
            </button>
        </div>

        <div v-if="player!.validActions.includes('episodes')" class="ugc-action ugc-action-episodes">
            <button
                class="button action-button button_back_to_episodes"
                v-on:click.prevent="onActionButtonClicked('episodes')"
            >
                {{ $t('UGC.BUTTON_BACK_TO_EPISODES') }}
            </button>
        </div>

        <div v-if="player!.validActions.includes('remove')" class="ugc-action ugc-action-remove">
            <div id="promptsCount" class="promptsCount" v-text="promptsCount" />
            <div id="promptsRegion">
                <div class="promptsList">
                    <div
                        v-for="(prompt, index) in player!.prompts"
                        :key="index"
                    >
                        <button
                            class="player-prompt"
                            :class="{
                                other: prompt.author !== userId
                            }"
                            v-on:click.prevent="onPromptClick(index)"
                        >
                            <span v-text="prompt.text" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import autosize from 'autosize'
import { Storage, Utils } from '@tv/shared'
import type { DrawfulAnimate } from '../DrawfulAnimate'

export default defineComponent({
    props: {
        player: Object as Prop<DrawfulAnimate.UGC.Entity>
    },

    data() {
        return {
            answer: ''
        }
    },

    computed: {
        ugcHeader(): string {
            if (this.player!.validActions.includes('load')) return this.$t('UGC.HEADER_DEFAULT')
            if (this.player!.validActions.includes('title')) return this.$t('UGC.HEADER_TITLE')
            if (this.player!.validActions.includes('add')) return this.$t('UGC.HEADER_WRITE')
            if (this.player!.validActions.includes('submit')) return this.$t('UGC.HEADER_PUBLISH')
            return ''
        },

        promptsCount() {
            const { count, maxCount, prompts } = this.player!
            if (!prompts) return 'no prompts'
            if (!maxCount) return 'no maxcount'
            if (count === undefined) return 'no count'
            let result = `${count}/${maxCount}`
            if (prompts.length < count) {
                result += ` (${count - prompts.length} hidden)`
            }
            return result
        },

        userId() {
            return Storage.isSupported ? Storage.get('uuid') : null
        },

        titleCharacterCount() {
            if (!this.player!.maxTitleLength) return ''
            return this.player!.maxTitleLength - this.answer.length
        },

        promptCharacterCount() {
            if (!this.player!.maxContentLength) return ''
            return this.player!.maxContentLength - this.answer.length
        }
    },

    mounted() {
        autosize([
            this.$refs.titleTextarea as HTMLElement,
            this.$refs.promptTextarea as HTMLElement
        ])
    },

    methods: {
        onKeypress(event: KeyboardEvent, target: string) {
            if (event.key === 'Enter') {
                if (target === 'prompt') this.createNewPrompt()
                if (target === 'title') void this.createNewEpisode()
            }
        },

        onInput(event: Event) {
            const target = event.target as HTMLTextAreaElement
            let maxLength = Number.MAX_SAFE_INTEGER
            if (this.player!.validActions.includes('title')) maxLength = this.player!.maxTitleLength
            if (this.player!.validActions.includes('add')) maxLength = this.player!.maxContentLength

            if (target.value.length > maxLength) {
                target.value = target.value.substring(0, maxLength)
            }

            target.value = Utils.sanitizeInput(target.value)

            this.answer = target.value
        },

        onToggleVisibility(target: any) {
            void this.$ecast.updateObject(this.player!.responseKey, {
                action: 'toggle-visibility',
                target
            }).catch(this.$handleEcastError)
        },

        onActionButtonClicked(action: DrawfulAnimate.UGC.Action) {
            void this.$ecast.updateObject(this.player!.responseKey, { action }).catch(this.$handleEcastError)
        },

        async showTermsOfService() {
            const agreed = await this.$showModal('Options', {
                text: this.$t('UGC.TOS_WARNING'),
                options: [
                    {
                        text: this.$t('UGC.TOS_WARNING_AGREE'),
                        classes: ['confirm'],
                        value: 'confirm'
                    },
                    {
                        text: this.$t('UGC.TOS_WARNING_BACK'),
                        classes: ['cancel'],
                        value: 'cancel'
                    }
                ]
            })
            if (agreed !== 'confirm') return
            void this.$ecast.updateObject(this.player!.responseKey, {
                action: 'submit'
            }).catch(this.$handleEcastError)
        },

        async showConfirmDeleteDialog() {
            const agreed = await this.$showModal('Options', {
                text: this.$t('UGC.DELETE_WARNING'),
                options: [
                    {
                        text: this.$t('UGC.DELETE_WARNING_CONFIRM'),
                        classes: ['confirm'],
                        value: 'confirm'
                    },
                    {
                        text: this.$t('UGC.DELETE_WARNING_CANCEL'),
                        classes: ['cancel'],
                        value: 'cancel'
                    }
                ]
            })
            if (agreed !== 'confirm') return

            void this.$ecast.updateObject(this.player!.responseKey, {
                action: 'remove-content'
            }).catch(this.$handleEcastError)
        },

        createNewEpisode() {
            void this.$ecast.updateObject(this.player!.responseKey, {
                action: 'title',
                text: this.answer
            }).catch(this.$handleEcastError)

            this.answer = ''
        },

        createNewPrompt() {
            if (this.player!.count === this.player!.maxCount) return
            void this.$ecast.updateObject(this.player!.responseKey, {
                action: 'add',
                text: this.answer
            }).catch(this.$handleEcastError)
            this.answer = ''
            setTimeout(() => {
                if (this.$refs.promptTextarea instanceof HTMLElement) {
                    this.$refs.promptTextarea.focus()
                }
            }, 0)
        },

        onEpisodeClick(index: number) {
            const episode = this.player!.episodes[index]
            const key = episode.remoteContentId || episode.localContentId
            void this.$ecast.updateObject(this.player!.responseKey, {
                action: 'load',
                contentId: key
            }).catch(this.$handleEcastError)
        },

        onPromptClick(index: number) {
            void this.$ecast.updateObject(this.player!.responseKey, {
                action: 'remove',
                key: index
            }).catch(this.$handleEcastError)
        }
    }
})
</script>

<style lang="scss">
.ugc {
    background-image: url('../images/DrawingStripesTile.png');

    .action-button {
        border: 14px solid black;
        background-color: black;
        color: white;
        border-image: url(../images/AnswerChoiceButton.svg) 7 fill;
        border-image-repeat: inherit;
        cursor: pointer;
        margin: 3px 0;
        width: 100%;
        min-height: 48px;
        font-size: 18px;
        background-clip: padding-box;

        &:disabled {
            cursor:not-allowed;
        }

        &:active:not(:disabled), &.chosen {
            border-image: url(../images/AnswerChoiceButtonActive.svg) 7 fill;
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
        &.other {
            background-color: #e2dc6b;
            color: black;
        }
    }
    button.player-prompt {
        min-height: 48px;
        font-size: 18px;
        background-color: transparent;
        border: 0px solid transparent;
        border-radius: 7px;
        color: black;
        padding-left: 44px;
        position: relative;
        width: 100%;
        text-align: left;
        &::after {
            content: '';
            height: 30px;
            width: 30px;
            background: url(../images/button_x.png) no-repeat center/80% black;
            border-radius: 15px;
            left: 7px;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
        }
        &:hover {
            background-color: rgba(0,0,0,0.2);
        }
        &.other {
            span {
                opacity: 0.5;
            };
        }
    }
    button.ugc-toggle-visibility-button {
        border: 0px solid transparent;
        width: 128px;
        height: 128px;
        background-repeat: no-repeat;
        background-position: bottom;
        background-size: 100% auto;
        vertical-align: middle;
        background-color: black;
        border: 3px solid black;
        border-radius: 6px;
        background-clip: padding-box;

        &.on {
            border: 3px solid transparent;
            background-color: transparent;
            background-position: top;
        }
        &.ugc-toggle-visibility-button-controller {
            background-image: url('./../images/controller.png')
        }
        &.ugc-toggle-visibility-button-screen {
            background-image: url('./../images/screen.png')
        }

        &:active, &:focus {
            border: 0px solid transparent;
            outline: none;
        }
    }
    button.button_back_to_menu, button.button_back_to_episodes {
        width: auto;
        margin: 20px auto 0px auto;
        padding: 0px 10px;
    }

    button.button_edit, button.button_publish, button.button_play, button.button_delete {
        width: auto;
        min-width: 50%;
        margin: 5px auto;
        padding: 0px 10px;
    }

    .promptInput, .titleInput {
        text-align: right;
        button.createButton {
            width: auto;
        }
    }

    .episodesList {
        .episodeId {
            display: block;
        }
    }
    textarea {
        background-clip: padding-box;
        border-image: url(../images/TextFrame.svg) 7 7 fill;
        border-style: solid;
        border-width: 7px;
        font-size: 18px;
        margin-bottom: 10px;
        padding: 10px;
        resize: none;
        text-transform: lowercase;
        width: 100%;
    }
}
</style>
