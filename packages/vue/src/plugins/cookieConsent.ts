import 'vanilla-cookieconsent/dist/cookieconsent.css'
import * as CookieConsent from 'vanilla-cookieconsent'
import type { Plugin } from 'vue'

/**
 * This shows a banner that informs users of our cookie policy and lets them opt
 * in or out of them.
 */

 declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $cc: typeof CookieConsent
    }
}

export const cookieConsentPlugin: Plugin = {
    install: (app, pluginConfig: CookieConsent.CookieConsentConfig) => {
        app.config.globalProperties.$cc = CookieConsent
        void app.config.globalProperties.$cc.run(pluginConfig)
    }
}
