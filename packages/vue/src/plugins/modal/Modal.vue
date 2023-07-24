<template>
<transition name="modal-transition">
    <div
        v-if="props"
        class="modal"
        :class="classes"
        v-on:keyup.esc="onBackgroundClick"
        v-on:click.self="onBackgroundClick"
    >
        <component
            :is="content"
            v-if="content"
            class="content"
            v-bind="props" v-on:resolve="onResolve"
        />
    </div>
</transition>
</template>


<script lang="ts">
import { defineComponent, Component } from 'vue'
import ErrorModal from './common/ErrorModal.vue'
import OptionsModal from './common/OptionsModal.vue'
import type { Modal } from './plugin'

export default defineComponent({
    data() {
        return {
            classes: <string[]|string> 'jbg',
            props: <Record<string, any>|null> null,
            resolve: <((...args: any[]) => void)|null> null,
            content: <Component | null> null
        }
    },

    beforeMount() {
        // @ts-ignore
        this.$registerModal(this)
    },

    methods: {
        show(component: Component | string, props: Record<string, any> = {}, options: Modal.Options = {}) {
            this.props = props
            this.classes = options.classes || 'jbg'

            if (component === 'Error') {
                this.content = ErrorModal
            } else if (component === 'Options') {
                this.content = OptionsModal
            } else {
                this.content = component as Component
            }

            return new Promise<any>((resolve) => {
                this.resolve = resolve as (...args: any[]) => void
            })
        },

        onResolve(...args: any[]) {
            this.props = null
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.resolve!(...args)
        },

        onBackgroundClick() {
            this.props = null
            this.resolve!()
        }
    }
})
</script>


<style lang="scss" scoped>
@use '@tv/shared/src/styles/jbg.scss' as jbg;

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1000;
}

.content {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(100% - 60px);
    max-width: 350px;
    padding: 25px;
    background: #FFF;
    border-radius: 20px;
    box-shadow: 0 8px 0 0 #333;
    transform: translate(-50%, -50%);
}

.jbg.modal {
    background: transparentize($color: jbg.$blueDarker, $amount: 0.15);
}

.jbg .content {
    box-shadow: 0 8px 0 0 rgba(0, 0, 0, 0.25);
}

:deep(.jbg.content) {
    text-align: center;

    .image {
        width: auto;
        height: 100px;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
    }

    .text {
        margin-top: 10px;
        font-size: 20px;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
    }

    .subtext {
        margin-top: 5px;
        padding: 0 20px;
        text-align: center;
        font-size: 14px;
        font-weight: normal;
        line-height: 1.2;
    }

    input {
        width: 100%;
        margin: 10px 0 0;
        text-align: center;

        &::placeholder {
            font-size: 16px;
        }
    }

    textarea {
        width: 100%;
        margin: 10px 0 0;
    }

    .actions {
        margin-top: 10px;
    }

    button {
        width: 100%;
        margin: 10px 0 0;
    }

    @media (max-width: 340px) {
        input {
            font-size: 16px;

            &::placeholder {
                font-size: 14px;
            }
        }

        button {
            height: 42px;
            font-size: 16px;
        }
    }
}

.modal-transition-enter-active,
.modal-transition-leave-active {
    transition: opacity .15s;

    .content {
        transition: transform .25s;
    }
}

.modal-transition-enter,
.modal-transition-leave-to {
    opacity: 0;

    .content {
        transform: translate(-50%, -50%) scale(0.85);
    }
}
</style>
