<template>
<transition name="toast-transition">
    <div v-if="isVisible && options" :class="options.type" class="jbg toast">
        <div class="constrain">
            <img
                class="close"
                alt="close"
                src="./close.svg"
                v-on:click="hide"
                v-on:keydown.esc="hide"
            >
            <p class="text">{{ options.text }}</p>
            <p class="subtext">{{ options.subtext }}</p>
            <p v-if="options.warning" class="warning">{{ options.warning }}</p>
            <div v-if="options.type === 'reconnecting'" class="spinner" />
        </div>
    </div>
</transition>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import type { Toast } from './plugin'

export default defineComponent({
    data() {
        return {
            isVisible: false,
            options: <Toast.Options|null> null,
            timeout: <number|null> null
        }
    },

    beforeMount() {
        // @ts-ignore
        this.$registerToast(this)
    },

    methods: {
        show(options: Toast.Options) {
            this.isVisible = true
            this.options = options

            if (this.timeout) {
                window.clearTimeout(this.timeout)
                this.timeout = null
            }

            if (options.duration) {
                this.timeout = window.setTimeout(() => {
                    this.hide()
                }, options.duration)
            }
        },

        hide() {
            this.isVisible = false
            this.options = null

            if (this.timeout) {
                window.clearTimeout(this.timeout)
                this.timeout = null
            }
        }
    }

})
</script>


<style lang="scss" scoped>
@use '@tv/shared/src/styles/jbg.scss' as jbg;

.toast {
    position: fixed;
    bottom: 0;
    left: 0;
    opacity: 1;
    width: 100%;
    height: 70px;
    z-index: 1000;
    background: transparent;

    &.reconnecting {
        animation: reconnecting-background 0.5s infinite alternate;
    }

    .constrain {
        padding: 12px 15px;
    }
}

.toast.generic, .toast.reconnecting {
    border-top: 6px solid #FFF;
    background: jbg.$blue;

    .text,
    .subtext {
        // avoid spinner overlap in locales with longer descriptions
        margin-right: 40px;
        color: #FFF;
        font-size: clamp(10px, 3vw, 14px);
    }

    .text {
        color: #FFF;
    }

    .subtext {
        font-weight: normal;
        line-height: 1;
        color: #FFF;
    }

    .close {
        display: none;
    }
}

.toast.broadcaster {
    color: #0C0C0C;
    font-family: 'Rubik', sans-serif;
    font-size: 18px;
    font-weight: 500;
    line-height: 28px;
    text-align: left;
    height: auto;

    .constrain {
        position: relative;
        padding: 12px 40px;
        background-color: #FCFCFC;
        border-radius: 0px;
        box-shadow: 0px 0px 13px rgba(0, 0, 0, 0.23);
    }

    .close {
        display: block;
        position: absolute;
        top: 16px;
        right: 13px;
        cursor: pointer;
    }

    .text {
        color: jbg.$twitch;
        height: 50px;
        line-height: 50px;
        margin: 30px 0px 17px 0px;
        padding-left: 50px;
        background: url('./twitch.svg') no-repeat center left/40px;
    }

    .subtext {
        padding-bottom: 20px;
    }

    .warning {
        border-top: 1px solid #CDCDCD;
        padding: 20px 0px;
        line-height: normal;
        padding-left: 50px;
        background: url('./warning.png') no-repeat center left/40px;
    }
}

.spinner {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 40px;
    height: 40px;
    border: 6px solid jbg.$blueDarker;
    border-radius: 20px;
    animation: reconnecting-spinner 1s infinite linear reverse;

    &:before {
        content: "";
        position: absolute;
        top: -6px;
        left: -6px;
        width: 40px;
        height: 40px;
        border: 6px solid jbg.$blueDarker;
        border-bottom: 6px solid #FFF;
        border-radius: 20px;
    }
}

@keyframes reconnecting-background {
    0% { background: jbg.$blue; }
    100% { background: jbg.$blueDark; }
}

@keyframes reconnecting-spinner {
    0% { transform: rotate(0deg); }
    0% { transform: rotate(360deg); }
}

.toast-transition-enter-active,
.toast-transition-leave-active {
    transition: bottom .15s, opacity 0.15s;
}

.toast-transition-enter,
.toast-transition-leave-to {
    bottom: -70px;
    opacity: 0;
}
</style>
