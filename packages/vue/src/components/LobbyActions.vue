<template>
<div class="lobby-actions" :class="{ vip: player.hasControls }">
    <p
        v-if="!messageLocation || messageLocation === 'top'"
        :class="localClasses.message"
        v-text="joinedCountText"
    />

    <template v-if="player.hasControls">
        <p v-if="player.status === 'waitingForMore'" :class="localClasses.status">{{ neededText }}</p>
        <button
            v-if="player.status === 'canStart'"
            :class="localClasses.action"
            v-on:click="onStartClick"
            v-text="startText || $t('LOBBY.BUTTON_START')"
        />
        <button
            v-if="player.status === 'countdown'"
            :class="localClasses.action"
            v-on:click="onCancelClick"
            v-text="cancelText || $t('LOBBY.BUTTON_CANCEL')"
        />
    </template>

    <template v-else-if="player.gamepadStart">
        <p v-if="player.status === 'waitingForMore'" :class="localClasses.status">{{ neededText }}</p>
        <p v-if="player.status === 'canStart'" v-t="'LOBBY.WAITING_FOR_GAMEPAD'" :class="localClasses.status" />
        <p v-if="player.status === 'countdown'" v-t="'LOBBY.GAME_STARTING'" :class="localClasses.status" />
    </template>

    <template v-else>
        <p v-if="player.status === 'waitingForMore'" :class="localClasses.status">{{ neededText }}</p>
        <p v-if="player.status === 'canStart'" :class="localClasses.status">{{ waitingForVIPText }}</p>
        <p v-if="player.status === 'countdown'" v-t="'LOBBY.GAME_STARTING'" :class="localClasses.status" />
    </template>

    <p
        v-if="messageLocation === 'bottom'"
        :class="localClasses.message"
        v-text="joinedCountText"
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
        cancelText: String,
        classes: Object as Prop<Classes>,
        messageLocation: String as Prop<Location>,
        shouldStart: Function as PropType<ShouldFn>,
        startText: String,
        gameStartedOptions: Object as Prop<Analytics.GameStartedOptions>,
        player: {
            type: Object as Prop<CommonEntities.Lobby>,
            required: true
        }
    },

    computed: {
        joinedCountText(): string {
            return this.$tc('LOBBY.JOINED_COUNT', this.player.joinedPlayers, {
                count: this.player.joinedPlayers,
                maxPlayers: this.player.maxPlayers
            })
        },

        localClasses(): Classes {
            return {
                message: this.classes?.message ?? 'message',
                status: this.classes?.status ?? 'status',
                action: this.classes?.action ?? 'action'
            }
        },

        neededText(): string {
            return this.$tc('LOBBY.PLAYERS_NEEDED', this.player.minPlayers - this.player.joinedPlayers)
        },

        waitingForVIPText(): string {
            return this.$t('LOBBY.WAITING_FOR_VIP', {
                name: this.player.vipName
            })
        }
    },

    methods: {
        async onCancelClick() {
            if (!this.player.responseKey) return

            try {
                await this.$ecast.updateObject(this.player.responseKey, {
                    action: 'cancel'
                })
            } catch (error) {
                this.$handleEcastError(error)
            }
        },

        async onStartClick() {
            if (!this.player.responseKey) return

            if (this.shouldStart) {
                const should = await Promise.resolve(this.shouldStart())
                if (!should) return
            }

            try {
                await this.$ecast.updateObject(this.player.responseKey, {
                    action: 'start'
                })

                // Analytics
                if (this.$ecastRoom.appTag) {
                    const options: Analytics.GameStartedOptions = this.gameStartedOptions || {}
                    options.numberOfPlayer = this.player.joinedPlayers
                    options.locale = this.$ecastRoom.locale

                    Analytics.gameStarted(this.$ecastRoom.appTag, options)
                }
            } catch (error) {
                this.$handleEcastError(error)
            }
        }
    }
})
</script>
