import merge from 'lodash/merge'

/**
 * A very simple static class for setting and retrieving
 * a users locale taking into account what is supported
 */

export class I18n {
    static locale: I18n.Locale
    static supported = ['en', 'fr', 'it', 'de', 'es', 'es-XL'] as const

    static set(locale?: string) {
        if (locale && this.isSupported(locale)) {
            this.locale = locale as I18n.Locale
            return
        }

        // Fall back to a user's most-preferred language that we support.
        // This may be overridden by the room's locale as a player connects.
        this.locale = this.getPreferredDeviceLocale()
    }

    private static getPreferredDeviceLocale(): I18n.Locale {
        const deviceLocales = navigator.languages

        for (let i = 0; i < deviceLocales.length; i++) {
            if (this.isSupported(deviceLocales[i])) {
                return deviceLocales[i] as I18n.Locale
            }
        }

        return this.supported[0]
    }

    private static isSupported(string: string): boolean {
        return Object.values(this.supported).includes(string as I18n.Locale)
    }

    /**
     * Joins multiple message objects into a single one
     */
    static mergeMessages(...messages: Record<string, any>[]): Record<string, any> {
        return merge(messages[0], ...messages)
    }
}

export namespace I18n {
    export type Locale = typeof I18n.supported[number]
    export type Messages<T> = Partial<Record<Locale, T>>
}
