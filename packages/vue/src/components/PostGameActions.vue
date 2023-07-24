<template>
<div v-if="player && player.status" class="post-game-actions" :class="{ vip: player.hasControls }">
    <p
        v-if="!messageLocation || messageLocation === 'top'"
        v-t="'POST_GAME.PLAY_AGAIN'"
        :class="localClasses.message"
    />

    <template v-if="player.hasControls">
        <button
            v-if="player.status === 'waiting'"
            v-t="'POST_GAME.BUTTON_SAME_PLAYERS'"
            :class="localClasses.action"
            v-on:click="onSamePlayersClick"
        />
        <button
            v-if="player.status === 'waiting'"
            v-t="'POST_GAME.BUTTON_NEW_PLAYERS'"
            :class="localClasses.action"
            v-on:click="onNewPlayersClick"
        />
        <button
            v-if="player.status === 'countdown'"
            v-t="'LOBBY.BUTTON_CANCEL'"
            :class="localClasses.action"
            v-on:click="onCancelClick"
        />
    </template>

    <template v-else-if="player.gamepadStart">
        <p v-t="'LOBBY.WAITING_FOR_GAMEPAD'" :class="localClasses.status" />
    </template>

    <template v-else>
        <p :class="localClasses.status">{{ waitingForVIPText }}</p>
    </template>

    <p
        v-if="messageLocation === 'bottom'"
        v-t="'POST_GAME.PLAY_AGAIN'"
        :class="localClasses.message"
    />
</div>
</template>


<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Analytics, CommonEntities } from '@tv/shared'

type Location = 'none' | 'top' | 'bottom'
type ShouldFn = (() => Promise<boolean>) | (() => boolean)

interface Classes {
    message?: string
    status?: string
    action?: string
}

export default defineComponent({
    props: {
        shouldStart: Function as PropType<ShouldFn>,
        messageLocation: String as Prop<Location>,
        classes: Object as Prop<Classes>,
        gameStartedOptions: Object as Prop<Analytics.GameStartedOptions>,
        player: {
            type: Object as Prop<CommonEntities.PostGame>,
            required: true
        }
    },

    computed: {
        localClasses(): Classes {
            return {
                message: this.classes?.message ?? 'message',
                status: this.classes?.status ?? 'status',
                action: this.classes?.action ?? 'action'
            }
        },

        waitingForVIPText(): string {
            return this.$t('LOBBY.WAITING_FOR_VIP', {
                name: this.player.vipName
            })
        }
    },

    methods: {
        async onSamePlayersClick() {
            if (!this.player.responseKey) return

            if (this.shouldStart) {
                const should = await Promise.resolve(this.shouldStart())
                if (!should) return
            }

            try {
                await this.$ecast.updateObject(this.player.responseKey, {
                    action: 'samePlayers'
                })

                // Analytics
                if (this.$ecastRoom.appTag) {
                    const options: Analytics.GameStartedOptions = this.gameStartedOptions || {}
                    options.isSequal = true
                    options.locale = this.$ecastRoom.locale

                    Analytics.gameStarted(this.$ecastRoom.appTag, options)
                }
            } catch (error) {
                this.$handleEcastError(error)
            }
        },

        async onNewPlayersClick() {
            if (!this.player.responseKey) return

            if (this.shouldStart) {
                const should = await Promise.resolve(this.shouldStart())
                if (!should) return
            }

            try {
                await this.$ecast.updateObject(this.player.responseKey, {
                    action: 'newPlayers'
                })
            } catch (error) {
                this.$handleEcastError(error)
            }
        },

        async onCancelClick() {
            if (!this.player.responseKey) return

            try {
                await this.$ecast.updateObject(this.player.responseKey, {
                    action: 'cancel'
                })
            } catch (error) {
                this.$handleEcastError(error)
            }
        }
    }
})
</script>
