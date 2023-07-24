import { ComponentPublicInstance, Plugin } from 'vue'

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        /**
        * Sets a new theme color that will be temporary until
        * this vue is destroyed or another theme is set
        */
        $setThemeColor(color: string): void
    }

    interface ComponentCustomOptions {
        /**
        * A css color value that will be used to theme the
        * browsers ui in safari and similar browsers
        */
        themeColor?: ThemeColor
    }
}

type ThemeColor = string | (() => string)

export const themePlugin: Plugin = {
    install: (app) => {
        let rootColor = ''
        let activeColor = ''

        const parseToColor = (themeColor: ThemeColor): string => {
            if (themeColor instanceof Function) return themeColor()
            return themeColor
        }

        const set = (color: string) => {
            const selector = document.querySelector('meta[name="theme-color"]')
            if (!selector) return

            if (document.body) {
                document.body.style.background = color
            }

            selector.setAttribute('content', color)
            activeColor = color
        }

        app.config.globalProperties.$setThemeColor = function s(this: ComponentPublicInstance, color: string) {
            this.$options.themeColor = color
            set(color)
        }

        app.mixin({
            mounted(this: ComponentPublicInstance) {
                if (!this.$options.themeColor) return

                const color = parseToColor(this.$options.themeColor)
                set(color)

                if (this.$attrs.name === 'game') {
                    rootColor = color
                }
            },

            beforeDestroy(this: ComponentPublicInstance) {
                if (!this.$options.themeColor) return
                const color = parseToColor(this.$options.themeColor)

                if (color !== activeColor) return
                set(rootColor)
            }
        })
    }
}
