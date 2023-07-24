import type { InjectionKey } from 'vue'
import type { Fatal } from './plugins/fatal/plugin'
import type { Modal } from './plugins/modal/plugin'

export const InjectionKeys = {
    fatal: {
        error: Symbol('fatal.error') as InjectionKey<Fatal.Error>
    },

    modal: {
        active: Symbol('modal.active') as InjectionKey<Modal.Active | Record<string, never>>
    },

    textDescriptions: {
        announcement: Symbol('textDescriptions.announcement') as InjectionKey<string>
    }
}
