<template>
<div class="lobby scrollable" :class="{ isFriendMode: player!.isFriendMode }">
    <div class="header" v-text="info!.name" />
    <div class="constrain">
        <LobbyActions
            :player="player!"
            :classes="{ action: 'buttonBlack' }"
            :should-start="shouldStart"
            :game-started-options="gameStartedOptions"
        />
        <div v-if="player!.playerCanDoEpisodes">
            <div v-if="player!.activeContentId">
                <div>{{ player!.episodeTitle }}</div>
                <button
                    v-if="player!.activeContentId"
                    v-t="'LOBBY.VIP_EPISODES_UNLOAD'"
                    class="buttonBlack"
                    v-on:click.prevent="onActionEvent('ugc-unload')"
                />
                <button
                    v-if="player!.playerCanReport"
                    v-t="'LOBBY.VIP_EPISODES_REPORT'"
                    class="buttonBlack"
                    v-on:click.prevent="onReportClick"
                />
                <button
                    v-if="player!.playerCanViewAuthor"
                    v-t="'LOBBY.VIP_EPISODES_VIEW_AUTHOR'"
                    class="buttonBlack"
                    v-on:click.prevent="onActionEvent('ugc-view-author')"
                />
            </div>
            <div v-else>
                <button v-t="'LOBBY.VIP_EPISODES_MENU'" class="buttonBlack" v-on:click.prevent="onEpisodesClick" />
            </div>
            <div v-if="player!.lastUGCResult && player!.lastUGCResult.error">
                {{ player!.lastUGCResult.error }}
            </div>
        </div>
    </div>
</div>
</template>


<script lang="ts">
import { Component, defineComponent, shallowRef } from 'vue'
import { LobbyActions } from '@tv/vue'
import EpisodesModal from './EpisodesModal.vue'
import type { DrawfulAnimate } from '../DrawfulAnimate'

interface EpisodeModalResult {
    action: 'load' | 'input' | undefined
    contentId?: string
    answer?: string
}

export default defineComponent({
    components: {
        LobbyActions
    },

    props: {
        info: Object as Prop<DrawfulAnimate.Info>,
        player: Object as Prop<DrawfulAnimate.Lobby.Entity>
    },

    data() {
        return {
            showEpisodesModal: false
        }
    },

    computed: {
        gameStartedOptions() {
            return {
                mode: this.player!.isFriendMode ? 'friend' : 'standard',
                isUGC: this.player!.activeContentId !== undefined
            }
        }
    },

    methods: {
        async shouldStart() {
            if (!this.player!.allPlayersHavePortraits) {
                const portraitPrompt = await this.$showModal('Options', {
                    text: this.$t('LOBBY.VIP_PORTRAIT_WARNING'),
                    options: [{
                        text: this.$t('LOBBY.VIP_PORTRAIT_WARNING_CONFIRM'),
                        value: 'confirm'
                    }, {
                        text: this.$t('LOBBY.VIP_PORTRAIT_WARNING_CANCEL'),
                        value: 'cancel'
                    }]
                })

                if (portraitPrompt !== 'confirm') return false
            }

            return true
        },

        onActionEvent(action: string) {
            if (!this.player!.responseKey) return

            void this.$ecast.updateObject(this.player!.responseKey, {
                action
            }).catch(this.$handleEcastError)
        },

        onReportClick() {
            window.location.href = `mailto:support@jackboxgames.com?subject=Report episode id ${this.player!.formattedActiveContentId}`
        },

        async onEpisodesClick() {
            const result = await this.$showModal<EpisodeModalResult>(shallowRef(EpisodesModal) as Component, {
                episodes: this.player!.history
            })

            // Back button
            if (!result) return
            if (!this.player!.responseKey) return

            // Episode by id
            if (result.action === 'load') {
                void this.$ecast.updateObject(this.player!.responseKey, {
                    activateContentId: true,
                    contentId: result.contentId
                }).catch(this.$handleEcastError)
            }

            // Episode by input
            if (result.action === 'input') {
                const contentId = result.answer?.replace(/[^A-Za-z]/gi, '').toUpperCase() || ''
                if (contentId.length < 7) return

                void this.$ecast.updateObject(this.player!.responseKey, {
                    activateContentId: true,
                    contentId
                }).catch(this.$handleEcastError)
            }
        }
    }
})
</script>

<style lang="scss">
.lobby.isFriendMode {
    background-image: url(../images/LobbyFriendModeStripesTile.png);
}
</style>
