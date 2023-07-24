import { Component, Plugin } from 'vue'
import Modal from './Modal.vue'

declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        $hideModal(): void

        /**
        * Shows a jbg styled error modal
        */
        $showModal(component: 'Error', props: Modal.ErrorModal.Options, options?: Modal.Options): Promise<void>

        /**
        * Shows a jbg styled options modal
        */
        $showModal(component: 'Options', props: Modal.OptionsModal.Options, options?: Modal.Options): Promise<string|void>

        /**
        * Shows a provided component as a modal
        */
        $showModal<T>(component: Component, props?: Record<string, any>, options?: Modal.Options): Promise<T|void>

        $registerModal(instance: typeof Modal): void
    }
}

export const modalPlugin: Plugin = {
    install: (app) => {
        if (app.config.globalProperties.$showModal) return

        let instance: typeof Modal | undefined

        const hideModal = <T>(): (T|void) => {
            if (!instance) throw new Error('No ModalComponent is registered')
            return instance.onBackgroundClick()
        }

        const showModal = <T>(component: Component | string, props?: Record<string, any>, options?: Modal.Options): (T|void) => {
            if (!instance) throw new Error('No ModalComponent is registered')
            return instance.show(component, props, options)
        }

        const registerModal = (modal: typeof Modal) => {
            instance = modal
        }

        app.component('Modal', Modal as Component)
        app.config.globalProperties.$hideModal = hideModal
        app.config.globalProperties.$showModal = showModal
        app.config.globalProperties.$registerModal = registerModal
    }
}

export namespace Modal {
    export interface Options {
        classes?: string | string[]
    }

    export namespace ErrorModal {
        export interface Options {
            image?: string
            text: string
            subtext?: string
            classes?: string | string[]
            dismissText: string
        }
    }

    export namespace OptionsModal {
        export interface Options {
            text?: string
            subtext?: string
            classes?: string | string[]
            options: {
                text: string
                classes?: string | string[]
                value: string
            }[]
        }
    }
}
