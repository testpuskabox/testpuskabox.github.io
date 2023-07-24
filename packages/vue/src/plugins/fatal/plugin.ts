import {
    Component,
    computed,
    Plugin,
    reactive
} from 'vue'
import type * as Sentry from '@sentry/browser'
import {
    EcastEntityNotFound,
    EcastFilterError,
    EcastRateLimitExceeded
} from '@jackboxgames/ecast/errors'
import { InjectionKeys } from '../../InjectionKeys'
import Fatal from './Fatal.vue'

const fatalError = reactive<Fatal.Error>({
    hasCrashed: false
})

declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        /**
        * Warns about ecast errors that shouldn't fatally crash or be
        * sent to Sentry, throws the error otherwise.
        */
        $handleEcastError(Error: unknown, message?: any): void
    }
}

export const fatalPlugin: Plugin = {
    install: (app) => {
        if (app.config.globalProperties.$handleEcastError) return

        // TODO: remove @ts-ignore after Vue 3.3 release
        // https://vuejs.org/guide/components/provide-inject.html#working-with-reactivity
        // @ts-ignore
        app.provide(InjectionKeys.fatal.error, computed(() => fatalError))

        const handleEcastError = (error: unknown, message: any) => {
            if (error instanceof EcastEntityNotFound) {
                return console.warn(error)
            }

            if (error instanceof EcastFilterError) {
                return console.warn(error)
            }

            if (error instanceof EcastRateLimitExceeded) {
                return console.warn(error)
            }

            if (error instanceof Error && error.message?.includes('Socket not ready to send')) {
                return console.warn(error)
            }

            if (error instanceof Error && error.message?.includes('No connection available')) {
                return console.warn(error)
            }

            message ? console.error(message, error) : console.error(error)
            throw error
        }

        window.tv.onError = async (event, hint) => {
            if (event.level === 'error') {
                fatalError.hasCrashed = true
                fatalError.event = event
                fatalError.hint = hint
            }

            if (app.config.globalProperties.$debugRecorder) {
                const urls = await app.config.globalProperties.$debugRecorder.sendToEcast()
                return urls
            }

            return undefined
        }

        // global properties
        app.component('Fatal', Fatal as Component)
        app.config.globalProperties.$handleEcastError = handleEcastError
    }
}

export namespace Fatal {
    export interface Error {
        hasCrashed: boolean
        event?: Sentry.Event
        hint?: Sentry.EventHint
    }
}
