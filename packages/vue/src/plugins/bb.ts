import { ComponentPublicInstance, Plugin } from 'vue'
import { BBCodeParser, Tag } from '@jackboxgames/bbcode-parser'

type BBTagDefinition = Tag.MarkupGenerator | { generator: Tag.MarkupGenerator, options: Tag.CreateOptions}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        /**
        * Parses the provided string using the shared BBCode parser
        */
        $bb(string: string): string
    }

    interface ComponentCustomOptions {
        /**
        * Parses the provided string using the shared BBCode parser
        */
        bb?: Record<string, BBTagDefinition>
    }
}

export const bbPlugin: Plugin = {
    install: (app) => {
        const tags: Record<string, Tag> = {
            section: Tag.create('section', (_, content, { section }) => {
                const classTag = section
                    ? `class="section ${section}"`
                    : 'class="section"'

                return `<div ${classTag}>${content}</div>`
            })
        }

        // TODO: Refine generated HTML for accessibility.
        // https://html.spec.whatwg.org/multipage/text-level-semantics.html

        const boldTags = ['b', 'bold', 'B']
        boldTags.forEach((tagName: string) => {
            // <b> elements should be used to draw attention, not convey importance or alter voice
            // <strong> elements should be used to represent importance or seriousness of contents
            tags[tagName] = Tag.create(tagName, (_, content) => `<strong>${content}</strong>`)
        })

        const italicTags = ['i', 'italic', 'I']
        italicTags.forEach((tagName: string) => {
            // <cite> elements should be used with CSS to represent the title of a work
            // <em> elements should be used to emphasize contents
            tags[tagName] = Tag.create(tagName, (_, content) => `<em>${content}</em>`)
        })

        // Make it easy to reference Terms of Service or Privacy Policy from anywhere
        tags.tos = Tag.create('tos', (_, content) => `<a class="tosLink" href="https://jackboxgames.com/terms-of-service/" target="_blank">${content}</a>`)
        tags.pp = Tag.create('pp', (_, content) => `<a class="ppLink" href="https://jackboxgames.com/privacy-policy/" target="_blank">${content}</a>`)

        const parser = new BBCodeParser(tags)

        app.directive('bb', {
            mounted(el, binding) {
                const tempEl = document.createElement('div')
                tempEl.textContent = binding.value
                el.innerHTML = parser.parse(tempEl.innerHTML)
            },

            updated(el, binding) {
                const tempEl = document.createElement('div')
                tempEl.textContent = binding.value
                el.innerHTML = parser.parse(tempEl.innerHTML)
            }
        })

        app.mixin({
            beforeCreate(this: ComponentPublicInstance) {
                if (!this.$options.bb) return

                Object.keys(this.$options.bb).forEach((key) => {
                    const option = this.$options.bb![key]

                    if (option instanceof Function) {
                        parser.addTag(key, Tag.create(key, option))
                        return
                    }

                    parser.addTag(key, Tag.create(key, option.generator, option.options))
                })
            }
        })

        app.config.globalProperties.$bb = (content: any) => {
            if (typeof content !== 'string') {
                console.warn(
                    `[BBCodePlugin] Received unexpected ${typeof content} with value ${content};`
                  + 'converting to string before parsing.'
                )
            }

            return parser.parse(String(content))
        }
    }
}
