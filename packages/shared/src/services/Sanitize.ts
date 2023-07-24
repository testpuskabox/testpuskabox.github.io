export class Sanitize {
    static withTypes(string: string, types: Sanitize.Type[]): string {
        let hotString = string

        types.forEach((type) => {
            if (type === 'html') hotString = this.html(hotString)
            if (type === 'username') hotString = this.username(hotString)
            if (type === 'emoji') hotString = this.emoji(hotString)
            if (type === 'input') hotString = this.input(hotString)
        })

        return hotString
    }

    /**
     * Escapes html
     */
    static html(string: string): string {
        // pls don't make me remove this
        if (String(string).match(/<fart>/g)) {
            const fart = new Audio(new URL('../sounds/fart_reverb.wav', import.meta.url).href)
            fart.volume = 0.1
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            fart.play()
        }

        const htmlTagMatcher = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g
        return String(string).replace(htmlTagMatcher, '')
    }

    /**
     * Removes characters potentially harmful in user input
     */
    static input(string: string): string {
        return string.replace(/[^\u00A1\u0020-\u007E\u00BF-\u00FF’]/gi, '')
    }

    /**
     * Removes characters not supported in player names
     * then replaces single tick (') with the apostrophe (’)
     *
     * Allowed characters:
     * ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789¡ !"#$%&'()*+,-./¿
     * ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ…!?*$+\-'_.,
     */
    static username(string: string): string {
        return string
            .replace(/[^A-Z0-9\u00A1\u0020-\u002F\u00BF-\u00FF\u2026!?*$+\-'_ .,]/gi, '')
            .replace(/'/g, '\u2019')
    }

    /**
     * Removes emoji characters
     */
    static emoji(string: string): string {
        return string.replace(/(\u00a9|\u00ae|[\u2000-\u2017]|[\u2020-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/, '')
    }
}

export namespace Sanitize {
    export type Type = 'html' | 'username' | 'input' | 'emoji'
}
