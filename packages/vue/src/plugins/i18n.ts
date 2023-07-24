import get from 'lodash/get'
import sample from 'lodash/sample'
import type { App, Plugin } from 'vue'
import type { I18n } from 'vue-i18n'

/**
 * Our i18n plugin is meant to extend to functionality provided
 * already by vue-i18n with additional utilities we use often.
 */

 declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        /**
         * returns a random translated from an array
         */
        $ts(key: string): string
    }
}

function getSampleItem(i18n: I18n, key: string): string | undefined {
    const locale = i18n.global.locale
    // @ts-ignore
    const messages = i18n.global.messages[locale]
    const items = get(messages, key)

    if (!Array.isArray(items)) {
        console.warn(`[i18nPlugin] Translation with key ${key} is not an array`)
    }

    return sample(items)
}

export const i18nPlugin: Plugin = {
    install: (app: App, options: { i18n: I18n }) => {
        app.directive('ts', (el, binding) => {
            const message = getSampleItem(options.i18n, binding.value as string)
            el.textContent = message || ''
        })

        app.config.globalProperties.$ts = function ts(key: string): string {
            return getSampleItem(options.i18n, key) || ''
        }

        // HACK: Some asynchronous rendering can cause vue-i18n's `this.$t`
        // methods to be undefined. One workaround is to install them in global
        // app scope until the root cause can be addressed.
        // https://github.com/intlify/vue-i18n-next/issues/990
        app.config.globalProperties.$t = options.i18n.global.t
        app.config.globalProperties.$tc = options.i18n.global.tc
        app.config.globalProperties.$te = options.i18n.global.te
        app.config.globalProperties.$tm = options.i18n.global.tm
    }
}
