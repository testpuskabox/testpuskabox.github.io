import { Component, Plugin } from 'vue'
import Toast from './Toast.vue'

declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        /**
        * Shows a jbg styled toast notificiation
        */
        $showToast(options: Toast.Options): void

        /**
        * Hides any visible toast notifications
        */
        $hideToast(): void

        $registerToast(instance: typeof Toast): void
    }
}

export const toastPlugin: Plugin = {
    install: (app) => {
        if (app.config.globalProperties.$showToast) return

        let instance: typeof Toast | undefined

        const showToast = (options: Toast.Options) => {
            if (!instance) throw new Error('No ToastComponent is registered to show')
            instance.show(options)
        }

        const hideToast = () => {
            if (!instance) throw new Error('No ToastComponent is registered to hide')
            instance.hide()
        }

        const registerToast = (toast: typeof Toast) => {
            instance = toast
        }

        app.component('Toast', Toast as Component)
        app.config.globalProperties.$showToast = showToast
        app.config.globalProperties.$hideToast = hideToast
        app.config.globalProperties.$registerToast = registerToast
    }
}

export namespace Toast {
    export interface Options {
        type: 'generic' | 'reconnecting' | 'broadcaster'
        text: string
        subtext?: string
        duration?: number
        warning?: string
    }
}
