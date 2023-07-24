import { Plugin } from 'vue'

/**
 * Vibrate is a plugin that tries to vibrate a player's device, reporting if the
 * attempt succeeded or failed. The standard vibration pattern can be overriden
 * by the caller.
 */

type VibratePattern = number | number[]

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        /**
        * tries to vibrate a player's device, reporting if the
        * attempt succeeded or failed.
        */
        $vibrate(pattern?: VibratePattern): boolean
    }
}

export const vibratePlugin: Plugin = {
    install: (app) => {
        app.config.globalProperties.$vibrate = (pattern: VibratePattern = [100, 100]) => {
            if (!window.navigator?.vibrate) return false
            try {
                window.navigator.vibrate(pattern)
                return true
            } catch (error) {
                return false
            }
        }
    }
}
