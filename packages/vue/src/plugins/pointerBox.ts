import { Plugin } from 'vue'
import { PointerBox } from '@tv/shared'

export const pointerBoxPlugin: Plugin = {
    install: (app) => {
        const boxes = new Map<HTMLElement, PointerBox>()

        app.directive('pointerbox', {
            mounted(el: HTMLElement, binding) {
                const pointerBox = new PointerBox(el, {
                    restrictToBox: binding.modifiers.restrict,
                    isMultitouch: binding.modifiers.multi
                })

                boxes.set(el, pointerBox)
            },

            unmounted(el: HTMLElement) {
                boxes.get(el)?.destroy()
                boxes.delete(el)
            }
        })

        app.directive('pointerbox-translate', {
            mounted(el, binding) {
                el.setAttribute('data-pointerboxtranslateid', binding.value.id ?? '')
                el.setAttribute('data-pointerboxtranslatewidth', binding.value.width ?? '')
                el.setAttribute('data-pointerboxtranslateheight', binding.value.height ?? '')
            },

            unmounted(el: HTMLElement) {
                el.removeAttribute('data-pointerboxtranslateid')
                el.removeAttribute('data-pointerboxtranslatewidth')
                el.removeAttribute('data-pointerboxtranslateheight')
            }
        })
    }
}
