import {
    ref,
    computed,
    Component,
    Plugin
} from 'vue'
import TextDescriptions from './TextDescriptions.vue'
import { InjectionKeys } from '../../InjectionKeys'

const announcement = ref('')

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        /**
        * adds an item to "Text Descriptions"
        * to be read aloud by screen readers
        */
        $announce(text: string): void
    }
}

export const textDescriptionsPlugin: Plugin = {
    install: (app) => {
        if (app.config.globalProperties.$announce) return

        // TODO: remove @ts-ignore after Vue 3.3 release
        // https://vuejs.org/guide/components/provide-inject.html#working-with-reactivity
        // @ts-ignore
        app.provide(InjectionKeys.textDescriptions.announcement, computed(() => announcement.value))

        const announce = (text: string) => {
            announcement.value = text
        }

        app.component('TextDescriptions', TextDescriptions as Component)
        app.config.globalProperties.$announce = announce
    }
}
