<template>
<Fatal v-if="shouldShowFatal" />
<template v-else>
    <TextDescriptions />
    <component :is="mainView" id="game" :class="classes" v-bind="ecastValues" />
    <Debug />
    <Modal />
    <Toast />
</template>
</template>


<script lang="ts">
import { Component, defineComponent, inject } from 'vue'
import type { WSClient } from '@jackboxgames/ecast'
import type { TV } from '@tv/loader'
import { InjectionKeys } from '../InjectionKeys'

export default defineComponent({
    props: {
        options: Object as Prop<TV.MountOptions>,
        mainView: Object as Prop<Component>
    },

    // Typesafe injections are only available in the composition api
    setup() {
        return {
            fatalError: inject(InjectionKeys.fatal.error)
        }
    },

    data() {
        return {
            isKicked: false
        }
    },

    computed: {
        ecast(): WSClient {
            return this.$ecast
        },

        ecastValues(): Record<string, any> | null {
            if (!this.$ecastValues) return null
            return this.$ecastValues
        },

        classes(): string[] {
            return [`locale-${this.$i18n.locale}`]
        },

        shouldShowFatal(): boolean {
            return this.fatalError?.hasCrashed ?? false
        }
    },

    beforeMount() {
        this.$ecast.on('connection', (event) => { this.onConnection(event) })
        this.$ecast.on('client/connected', (event) => { this.onClientConnected(event) })
        this.$ecast.on('client/disconnected', (event) => { this.onClientDisconnected(event) })
        this.$ecast.on('room/exit', () => { void this.onRoomExit() })
        this.$ecast.on('client/kicked', () => { void this.onClientKicked() })
        this.$ecast.on('socketClose', () => { void this.onSocketClose() })
    },

    beforeUnmount() {
        // TODO: destroy ecast listeners
    },

    methods: {
        onConnection(event: WSClient.ConnectionEvent) {
            switch (event.status) {
            case 'waiting':
            case 'connecting':
                this.$showToast({
                    type: 'reconnecting',
                    text: this.$t('TOAST.RECONNECTING.CONTROLLER.TEXT'),
                    subtext: this.$t('TOAST.RECONNECTING.CONTROLLER.SUBTEXT', { attempt: event.attempt })
                })
                break
            case 'connected':
                this.$showToast({
                    type: 'generic',
                    text: this.$t('TOAST.RECONNECTED.TEXT'),
                    subtext: this.$t('TOAST.RECONNECTED.SUBTEXT'),
                    duration: 1500
                })
                break
            }
        },

        onClientConnected(event: WSClient.ClientConnected) {
            if (event.role !== 'host') return
            if (!event.reconnect) return

            this.$showToast({
                type: 'generic',
                text: this.$t('TOAST.RECONNECTED.TEXT'),
                subtext: this.$t('TOAST.RECONNECTED.SUBTEXT'),
                duration: 1500
            })
        },

        onClientDisconnected(event: WSClient.ClientDisconnected) {
            if (event.role !== 'host') return

            this.$showToast({
                type: 'reconnecting',
                text: this.$t('TOAST.RECONNECTING.GAME.TEXT'),
                subtext: this.$t('TOAST.RECONNECTING.GAME.SUBTEXT')
            })
        },

        async onRoomExit() {
            // hide any (re)connection toasts
            this.$hideToast()

            // thank them for playing
            await this.$showModal('Error', {
                image: 'moon',
                text: this.$t('ERROR.ROOM_DISCONNECTED'),
                subtext: this.$t('ERROR.ROOM_DESTROYED'),
                dismissText: this.$t('ACTION.OK')
            })

            window.location.reload()
        },

        async onClientKicked() {
            this.isKicked = true
            // hide any (re)connection toasts
            this.$hideToast()

            // tell them they have been bad
            await this.$showModal('Error', {
                image: 'tear',
                text: this.$t('ERROR.ROOM_DISCONNECTED'),
                subtext: this.$t('ERROR.PLAYER_KICKED'),
                dismissText: this.$t('ACTION.OK')
            })

            window.location.reload()
        },

        async onSocketClose() {
            if (!this.isKicked) {
                // hide any (re)connection toasts
                this.$hideToast()

                // thank them for playing
                await this.$showModal('Error', {
                    image: 'moon',
                    text: this.$t('ERROR.ROOM_DISCONNECTED'),
                    dismissText: this.$t('ACTION.OK')
                })

                window.location.reload()
            }
        }
    }
})
</script>

<style lang="scss">
*, *::before, *::after {
    box-sizing: border-box;
}

html, body {
    width: 100%;
    width: 100vw;
    height: 100%;
    height: 100vh;
    height: -moz-available;
    height: -webkit-fill-available;
    height: fill-available;
    height: stretch;
    overflow: hidden;
}

#app {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: auto;
}

.constrain {
    position: relative;
    width: 100%;
    min-height: 100%;
    min-width: 320px;
    max-width: 450px;
    margin: 0 auto;
}
</style>
