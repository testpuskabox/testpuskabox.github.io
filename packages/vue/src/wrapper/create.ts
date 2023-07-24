import {
    App,
    Component,
    createApp,
    Plugin
} from 'vue'
import { createI18n } from 'vue-i18n'
import { WSClient } from '@jackboxgames/ecast'
import type { TV } from '@tv/loader'
import {
    I18n,
    messages as sharedMessages,
    type DebugReplayer
} from '@tv/shared'
import { bbPlugin } from '../plugins/bb'
import { debugPlugin } from '../plugins/debug/plugin'
import { ecastPlugin } from '../plugins/ecast/plugin'
import { fatalPlugin } from '../plugins/fatal/plugin'
import { i18nPlugin } from '../plugins/i18n'
import { modalPlugin } from '../plugins/modal/plugin'
import { textDescriptionsPlugin } from '../plugins/text-descriptions/plugin'
import { themePlugin } from '../plugins/theme'
import { toastPlugin } from '../plugins/toast/plugin'
import { vibratePlugin } from '../plugins/vibrate'
import RootView from './Root.vue'


interface PluginWithOptions {
    plugin: Plugin
    options: any[]
}

interface CreateVueOptions {
    MainView: Component,
    messages?: Record<string, any>
    plugins?: (Plugin | PluginWithOptions)[]
}

export const createVueGame = (options: CreateVueOptions) => {
    let wsClient: WSClient

    window.tv.register({
        connect: (connectOptions: WSClient.InitOptions, replayer?: DebugReplayer) => {
            if (replayer) {
                wsClient = replayer.setClient(WSClient, connectOptions)
            } else {
                wsClient = new WSClient(connectOptions)
            }
            return wsClient.connect()
        },

        mount: (mountOptions: TV.MountOptions) => {
            // set a name on the root vue for better debug messages
            RootView.name = mountOptions.app

            // create the app
            let app: App | null = createApp(RootView as Component, {
                options: mountOptions,
                mainView: options.MainView
            })

            // i18n

            // Start with the user's device preference by not specifying a locale
            let locale

            // Match the locale of the current room if one exists
            if (mountOptions.room?.locale) {
                locale = mountOptions.room.locale
            }

            // Override the locale with any specified as a query parameter
            if (mountOptions.match?.params?.locale) {
                locale = mountOptions.match.params.locale
            }

            I18n.set(locale)
            const i18n = createI18n({
                fallbackLocale: 'en',
                locale: I18n.locale,
                messages: I18n.mergeMessages(sharedMessages, options.messages ?? {})
            })

            // plugins
            app.use(bbPlugin)
            app.use(modalPlugin)
            app.use(debugPlugin, {
                replayer: mountOptions.replayer,
                client: wsClient,
                room: mountOptions.room
            })
            app.use(ecastPlugin, {
                wsClient,
                room: mountOptions.room,
                welcome: mountOptions.welcome
            })
            app.use(fatalPlugin)
            app.use(i18n)
            app.use(i18nPlugin, { i18n })
            app.use(textDescriptionsPlugin)
            app.use(themePlugin)
            app.use(toastPlugin)
            app.use(vibratePlugin)

            // app specific plugins
            if (options.plugins) {
                const isPlugin = (item: Plugin | PluginWithOptions): item is Plugin => (item as PluginWithOptions).plugin === undefined

                options.plugins.forEach((item) => {
                    if (isPlugin(item)) {
                        app!.use(item)
                        return
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    app!.use(item.plugin, ...item.options)
                })
            }

            // let's Go
            app.mount('#app')

            return () => {
                app!.unmount()
                app = null
            }
        },

        info: (mountOptions: TV.MountOptions) => ({
            tag: mountOptions.app,
            version: mountOptions.version,
            type: mountOptions.type,
            wrapper: 'vue',
            branch: mountOptions.branch
        })
    })
}
