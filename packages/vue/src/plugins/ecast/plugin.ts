import { ComponentPublicInstance, Plugin } from 'vue'
import type { WSClient, ClientWelcome, GetRoomReply } from '@jackboxgames/ecast'
import { Artifacts } from '@tv/shared'
import { EcastManager } from './EcastManager'

const manager = new EcastManager()

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        /**
        * Shared instance of WSClient
        */
        $ecast: WSClient

        /**
        * Reactive values
        */
        $ecastValues: Record<string, any>

        /**
        * The room reply from the most recent connection
        */
        $ecastRoom: GetRoomReply

        /**
        * The welcome message from the most recent connection
        */
        $ecastWelcome: ClientWelcome

        /**
        * Setup function to allow for setting up the ecast plugin
        * at a time after app initialization
        */
        $setupEcast(options: EcastPluginOptions): void

        /**
        * Force a sync of values
        */
        $syncEcast(): void

        /**
        * Pause updates on provided keys or all keys if no
        * keys params is passed
        */
        $pauseEcastUpdates(keys?: string[]): void

        /**
        * Resumes updates and catches up on any updates while paused
        */
        $resumeEcastUpdates(): void
    }

    interface ComponentCustomOptions {
        /**
        * Defines if this game needs to support
        * and parse the blobcast protocol
        */
        usesBlobcast?: boolean

        /**
        * A mapping of prop names to entity keys
        */
        ecastKeys?: Record<string, string | EcastManager.KeyMapFn | EcastManager.KeyMapObject>


        /**
        * A mapping of prop names to function that
        * provide that prop with its values
        */
        ecastProviders?: Record<string, EcastManager.ProviderMapFn | EcastManager.ProviderMapObject>
    }
}

export const ecastPlugin: Plugin = {
    install: (app, options?: EcastPluginOptions) => {
        app.config.globalProperties.$setupEcast = (options: EcastPluginOptions) => {
            // setup manager
            manager.setWSClient(options.wsClient)
            options.wsClient.on('artifact', (entity) => Artifacts.add(entity))
            options.wsClient.on('connection', (event) => {
                if (event.status !== 'connected') return
                manager.setupWatcher()
            })
            manager.sync()

            // global properties
            app.config.globalProperties.$ecast = manager.wsClient
            app.config.globalProperties.$ecastValues = manager.mappedValues
            app.config.globalProperties.$ecastRoom = options.room
            app.config.globalProperties.$ecastWelcome = options.welcome
            app.config.globalProperties.$syncEcast = manager.sync
            app.config.globalProperties.$pauseEcastUpdates = manager.pause
            app.config.globalProperties.$resumeEcastUpdates = manager.resume

            // options providing mixin
            app.mixin({
                beforeCreate(this: ComponentPublicInstance) {
                    if (this.$options.ecastKeys) {
                        manager.addKeys(this.$options.ecastKeys)
                    }

                    if (this.$options.ecastProviders) {
                        manager.addProviders(this.$options.ecastProviders)
                    }
                },

                beforeDestroy(this: ComponentPublicInstance) {
                    if (this.$options.ecastKeys) {
                        manager.purgeKeys(this.$options.ecastKeys)
                    }

                    if (this.$options.ecastProviders) {
                        manager.purgeProviders(this.$options.ecastProviders)
                    }
                }
            })
        }

        if (options?.wsClient) {
            app.config.globalProperties.$setupEcast(options)
        }
    }
}

interface EcastPluginOptions {
    wsClient: WSClient
    room: GetRoomReply
    welcome: ClientWelcome
}
