import { Component, Plugin } from 'vue'
import { DebugRecorder, DebugReplayer, Utils } from '@tv/shared'
import { GetRoomReply, WSClient } from '@jackboxgames/ecast'
import DebugNav from './DebugNav.vue'
import Feedback from './Feedback.vue'

declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        /**
         * Active recorder if this is not a debug controller
         */
        $debugRecorder?: DebugRecorder

        /**
         * Active replayer if this is a debug controller
         */
        $debugReplayer?: DebugReplayer
    }
}

export const debugPlugin: Plugin = {
    install: (app, options: DebugPluginOptions) => {
        if (app.config.globalProperties.$debugRecorder) return
        if (app.config.globalProperties.$debugReplayer) return

        // debug controllers set the debug navigation as
        // the "Debug" component and return
        if (options.replayer) {
            app.config.globalProperties.$debugReplayer = options.replayer
            app.component('Debug', DebugNav as Component)
            return
        }

        app.config.globalProperties.$debugRecorder = new DebugRecorder(options.client!, options.room!)

        if (!app.config.globalProperties.$showModal) {
            console.warn('[debugPlugin] Sending debug and feedback messages is disabled because the modalPlugin is missing.')
            return
        }

        // only show the feedback button on production if the ?feedback=true
        // query param is set
        if (!Utils.isProduction() || Utils.getQueryParam('feedback')) {
            app.component('Debug', Feedback as Component)
        }
    }
}

interface DebugPluginOptions {
    replayer?: DebugReplayer
    client?: WSClient
    room?: GetRoomReply
}
