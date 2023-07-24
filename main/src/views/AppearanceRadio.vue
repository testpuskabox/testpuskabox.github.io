<template>
<li class="appearance">
    <label v-t="'MENU.APPEARANCE'" for="appearance" />
    <fieldset id="appearance">
        <svg viewBox="0 0 340 85">
            <rect
                class="frame"
                x="87.5"
                width="165"
                height="85"
                rx="42.5"
                vector-effect="non-scaling-stroke"
            />
            <circle
                class="indicator"
                cx="170"
                cy="42.5"
                r="29.8"
            />
            <path
                class="celestial moon"
                d="M314.64,14.79A29.36,29.36,0,0,1,275,54.4a29.37,29.37,0,1,0,39.6-39.61Z"
                vector-effect="non-scaling-stroke"
            />
            <circle
                class="celestial sun"
                cx="32.19"
                cy="42.72"
                r="13.05"
                vector-effect="non-scaling-stroke"
            />
            <line
                x1="32.19"
                y1="10.53"
                x2="32.19"
                y2="21.59"
                vector-effect="non-scaling-stroke"
            />
            <line
                x1="32.19"
                y1="63.85"
                x2="32.19"
                y2="74.91"
                vector-effect="non-scaling-stroke"
            />
            <line
                x1="0"
                y1="42.72"
                x2="11.06"
                y2="42.72"
                vector-effect="non-scaling-stroke"
            />
            <line
                x1="53.32"
                y1="42.72"
                x2="64.38"
                y2="42.72"
                vector-effect="non-scaling-stroke"
            />
            <line
                x1="12.01"
                y1="22.55"
                x2="17.25"
                y2="27.78"
                vector-effect="non-scaling-stroke"
            />
            <line
                x1="47.13"
                y1="57.66"
                x2="52.36"
                y2="62.89"
                vector-effect="non-scaling-stroke"
            />
            <line
                x1="12.01"
                y1="62.89"
                x2="17.25"
                y2="57.66"
                vector-effect="non-scaling-stroke"
            />
            <line
                x1="47.13"
                y1="27.78"
                x2="52.36"
                y2="22.55"
                vector-effect="non-scaling-stroke"
            />
        </svg>

        <input
            id="light"
            v-model="value"
            type="radio"
            name="theme"
            value="light"
            :aria-label="$t('MENU.LIGHT')"
        >
        <input
            id="dark"
            v-model="value"
            type="radio"
            name="theme"
            value="dark"
            :aria-label="$t('MENU.DARK')"
        >
    </fieldset>
</li>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import { Storage } from '@tv/shared'

type Theme = 'dark' | 'light' | 'device'

export default defineComponent({
    data() {
        return {
            value: <Theme> Storage.get('preference:theme') || 'device'
        }
    },

    watch: {
        value(newValue: Theme) {
            Storage.set('preference:theme', newValue)
            window.dispatchEvent(new CustomEvent<Theme>('themedidchange'))
        }
    }
})
</script>


<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

li.appearance {
    position: relative;
    margin: 0 auto 10px;

    label {
        margin: 0 0 5px 0;
        font-size: 12px;
        color: jbg.$white;
    }

    fieldset {
        position: relative;
        width: 100%;
        height: 45px;
    }

    input {
        position: relative;
        display: inline-block;
        width: 50%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: transparent;
        border: none;
        -webkit-appearance: none;
        appearance: none;
    }

    svg {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        overflow: visible;
        stroke-linejoin: round;
        stroke-linecap: round;
        stroke: jbg.$white;;
        stroke-width: 2px;

        .frame {
            fill: jbg.$blueDarker;
            stroke-width: 2.5px;
        }

        .indicator {
            fill: jbg.$white;;
            stroke-width: 0;
            transition: transform 0.2s;
        }

        .celestial {
            stroke-width: 2px;
            fill: transparent
        }
    }
}

.theme-device li.appearance svg {
    .indicator { transform: translateX(-11%); }
    .celestial.sun { fill: jbg.$white; }
    .celestial.moon { fill: transparent; }

    @media (prefers-color-scheme: dark) {
        .indicator { transform: translateX(11%); }
        .celestial.sun { fill: transparent; }
        .celestial.moon { fill: jbg.$white; }
    }
}

.theme-light li.appearance svg {
    .indicator { transform: translateX(-11%); }
    .celestial.sun { fill: jbg.$white; }
}

.theme-dark li.appearance svg {
    .indicator { transform: translateX(11%); }
    .celestial.moon { fill: jbg.$white; }
}
</style>
