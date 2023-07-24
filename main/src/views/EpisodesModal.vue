<template>
<div class="drawful-animate episodes">
    <button class="backButton buttonBlack" v-on:click.prevent="onBackClick">{{ $t('LOBBY.VIP_EPISODES_BACK') }}</button>
    <div>{{ $t('LOBBY.VIP_EPISODES_LOAD') }}</div>
    <fieldset class="inputEpisode">
        <input
            v-model="answer"
            v-maska="'XXX-XXXX'"
            rows="1"
            placeholder="???-????"
            v-on:input="onAnswerInput"
        >
        <button class="submit buttonBlack" v-on:click.prevent="onSubmitInput">{{ $t('LOBBY.VIP_EPISODES_SUBMIT') }}</button>
    </fieldset>
    <div class="episodes-warning">{{ $t('LOBBY.VIP_EPISODES_WARNING') }}</div>
    <div v-if="episodes!.length">
        <div>{{ $t('LOBBY.VIP_EPISODES_SELECT') }}</div>
        <button
            v-for="(episode, index) in episodes"
            :key="episode.remoteContentId || episode.localContentId"
            class="episode buttonBlack"
            v-on:click.prevent="onEpisodeClick(index)"
        >
            {{ episode.metadata.title }}
            <span
                v-if="episode.remoteContentId"
                class="episodeId"
            >{{ episode.formattedRemoteContentId }}</span>
        </button>
    </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { DrawfulAnimate } from '../DrawfulAnimate'

interface Resolution {
    action?: 'load' | 'input'
    contentId?: string
    answer?: string
}

export default defineComponent({
    props: {
        episodes: Array as Prop<DrawfulAnimate.UGC.Episode[]>
    },

    emits: {
        resolve: (_: Resolution) => true
    },

    data() {
        return {
            answer: ''
        }
    },

    methods: {
        onEpisodeClick(index: number) {
            const episode = this.episodes![index]
            const contentId = episode.remoteContentId || episode.localContentId
            // activate a content id
            this.$emit('resolve', {
                action: 'load',
                contentId
            })
        },

        onAnswerInput(event: Event) {
            const target = event.target as HTMLInputElement
            this.answer = target.value
        },

        onBackClick() {
            // close the modal
            this.$emit('resolve', {})
        },

        onSubmitInput() {
            // emit the input
            this.$emit('resolve', {
                action: 'input',
                answer: this.answer
            })
        }
    }
})
</script>

<style lang="scss">
@use '../styles/vars.scss' as drawful;

.episodes.content {
    border-radius: 0px;
    border-width: 8px;
    border-style: solid;
    border-image: url(../images/DrawingFrame.svg) 6 7 fill;
    background-clip: padding-box;
    background-color: transparent;

    text-align: center;
    user-select: none;
    font-family: drawful.$typewriter;
    * {
        font-size: 24px;
        font-family: drawful.$typewriter;
    }

    input, input::-webkit-input-placeholder {
        font-size: 24px;
    }

    .inputEpisode {
        text-align: right;
    }

    max-height:90%;
    overflow-y: auto;
    .episode {
        display: block;
        width: 100%;
        margin-bottom: 10px;
        .episodeId {
            display: block;
            color: #FF28B7;
        }
    }

    .episodes-warning {
        font-size: 11px;
        color: #FF28B7;
        margin: 6px auto;
    }
    .backButton, .submit {
        width: auto;
        padding: 3px 15px;
        border-width: 10px;
    }
    .submit {
        margin-right: 10px;
    }
}
</style>
