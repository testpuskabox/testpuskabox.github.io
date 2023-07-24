import { App, Component, createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { register } from 'swiper/element/bundle'
import type { CookieConsentConfig, Translation } from 'vanilla-cookieconsent'

import {
    I18n,
    messages as sharedMessages
} from '@tv/shared'
import {
    bbPlugin,
    cookieConsentPlugin,
    fatalPlugin,
    i18nPlugin,
    modalPlugin
} from '@tv/vue'
import type { TV } from '@tv/loader'

import { messages } from './i18n/messages'
import MainView from './views/Main.vue'
import './styles/app.scss'

// enable Swiper custom elements
register()

window.tv.register({
    mount: (mountOptions: TV.MountOptions) => {
        // create the app
        let app: App | null = createApp(MainView as Component, { options: mountOptions })

        // i18n

        // Start with the user's device preference by not specifying a locale
        let locale

        // Override the locale with any specified as a query parameter
        if (mountOptions.match?.params?.locale) {
            locale = mountOptions.match.params.locale
        }

        I18n.set(locale)
        const i18n = createI18n({
            fallbackLocale: 'en',
            locale: I18n.locale,
            messages: I18n.mergeMessages(sharedMessages, messages)
        })

        // plugins
        app.use(bbPlugin)
        app.use(fatalPlugin)
        app.use(i18n)
        app.use(i18nPlugin, { i18n })
        app.use(modalPlugin)

        // setup cookie consent plugin last so its BBCode can be parsed
        app.use(cookieConsentPlugin, <CookieConsentConfig>{
            // TODO: Figure out if we should do anything special when a user
            // interacts with the consent modal
            onChange: ({ cookie }) => {
                console.log('user changed their cookie preferences:\n', cookie)
            },
            onFirstConsent: ({ cookie }) => {
                console.log('user set cookie preferences for the first time:\n', cookie)
            },
            revision: 1,
            // TODO: Consider setting CSS variables for styling and overriding
            // base classes like `#cm__btn` if we hate them
            guiOptions: {
                consentModal: {
                    layout: 'bar inline',
                    position: 'bottom',
                    equalWeightButtons: true,
                    flipButtons: true
                },
                preferencesModal: {
                    layout: 'box',
                    position: 'right',
                    equalWeightButtons: true,
                    flipButtons: false
                }
            },
            categories: {
                necessary: {
                    readOnly: true
                }
            },
            language: {
                default: 'en',
                autoDetect: 'browser',
                translations: I18n.supported.reduce((translations, language) => {
                    if (!messages[language]?.COOKIE) {
                        return translations
                    }

                    translations[language] = {
                        consentModal: {
                            label: messages[language]!.COOKIE.CONSENT_MODAL.ARIA,
                            description: app!.config.globalProperties.$bb(messages[language]!.COOKIE.DESCRIPTION),
                            acceptAllBtn: messages[language]!.COOKIE.ACCEPT_ALL,
                            acceptNecessaryBtn: messages[language]!.COOKIE.REJECT_ALL
                        },
                        // NOTE: No current plans to show the full preferences
                        // modal. Revisit this if we start having multiple
                        // categories of cookies to store.
                        preferencesModal: {
                            // title: 'Consent Preferences',
                            // acceptAllBtn: messages[language]!.COOKIE.ACCEPT_ALL,
                            // acceptNecessaryBtn: messages[language]!.COOKIE.REJECT_ALL
                            // savePreferencesBtn: 'Save preferences',
                            // closeIconLabel: 'Close modal',
                            // serviceCounterLabel: 'Service|Services',
                            sections: [
                                // {
                                //     title: 'Cookie Usage',
                                //     description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
                                // },
                                // {
                                //     title: 'Strictly Necessary Cookies <span class="pm__badge">Always Enabled</span>',
                                //     description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                                //     linkedCategory: 'necessary'
                                // },
                                // {
                                //     title: 'More information',
                                //     description: 'For questions about our policy on cookies and your choices, please <a class="cc__link" href="#yourdomain.com">contact us</a>.'
                                // }
                            ]
                        }
                    }

                    return translations
                }, <Record<string, Translation>>{})
            }
        })

        // let's go
        app.mount('#app')

        return () => {
            app!.unmount()
            app = null
        }
    },

    info: (mountOptions: TV.MountOptions) => ({
        tag: '@connect',
        version: mountOptions.version,
        type: mountOptions.type,
        branch: mountOptions.branch
    })
})
