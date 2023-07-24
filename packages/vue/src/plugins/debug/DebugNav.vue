<template>
<div v-if="replayer" ref="debugNav" class="debug-nav" tabindex="0">
    <div v-if="showPowerNav" class="power-nav">
        <button class="close" v-on:click="onClosePowerNavClick">X</button>
        <p>MARKERS</p>
        <ul>
            <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
            <li
                v-for="marker, index in replayer.markerMap" :key="index"
                :class="{ active: index === replayer.currentMarkerItemIndex }"
                v-on:click="onMarkerClick(index)"
            >
                {{ marker[1].marker }}
            </li>
        </ul>

        <button class="option" v-on:click="onKillClick">KILL<br>ROOM</button>
        <button class="option" v-on:click="onDisconnectClick">DISCONNECT</button>
    </div>

    <p class="title blurred">DEBUG</p>
    <p v-if="!replayer.markerMap.length" class="title focused">Item #{{ replayer.currentEntityItemIndex }}</p>
    <p v-else class="title focused">
        {{ replayer.currentMarkerItemIndex }} : {{ replayer.currentMarkerItem[1].marker }}
        ({{ replayer.currentEntityItemIndex }})
    </p>

    <button v-if="!showPowerNav" class="open-power-nav" v-on:click="onOpenPowerNavClick">
        <svg viewBox="0 0 20 10">
            <polygon points="0,10 10,0 20,10" />
        </svg>
        <div class="visually-hidden">Open debug menu</div>
    </button>

    <button class="direction previous" v-on:click="onPreviousClick">
        <svg viewBox="0 0 60 50">
            <polygon class="outline" points="40,35.6 20,25 40,14.4" />
            <polygon points="40,35.6 20,25 40,14.4" />
        </svg>
        <div class="visually-hidden">Previous</div>
    </button>

    <button class="direction next" v-on:click="onNextClick">
        <svg viewBox="0 0 60 50">
            <polygon class="outline" points="40,35.6 20,25 40,14.4" />
            <polygon points="40,35.6 20,25 40,14.4" />
        </svg>
        <div class="visually-hidden">Next</div>
    </button>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import type { DebugReplayer } from '@tv/shared'

export default defineComponent({
    data() {
        return {
            showPowerNav: false
        }
    },

    computed: {
        debugNav(): HTMLElement {
            return this.$refs.debugNav as HTMLElement
        },

        replayer(): DebugReplayer | undefined {
            return this.$debugReplayer
        }
    },

    mounted() {
        window.addEventListener('keydown', (event) => {
            if (event.key === ',') return this.replayer?.toPreviousEntity()
            if (event.key === '.') return this.replayer?.toNextEntity()
            if (event.key === 'q') return this.replayer?.toPreviousMarker()
            if (event.key === 'w') return this.replayer?.toNextMarker()
            return null
        })
    },

    methods: {
        onPreviousClick() {
            this.replayer?.toPreviousMarker()
        },

        onNextClick() {
            this.replayer?.toNextMarker()
        },

        onOpenPowerNavClick() {
            this.showPowerNav = true
            this.debugNav.focus()
        },

        onClosePowerNavClick() {
            this.showPowerNav = false
            this.debugNav.focus()
        },

        onMarkerClick(index: number) {
            this.replayer?.toMarkerIndex(index)
        },

        onKillClick() {
            this.replayer?.kill()
        },

        onDisconnectClick() {
            this.replayer?.disconnect()
        }
    }
})
</script>


<style lang="scss" scoped>
.debug-nav {
    cursor: pointer;
    position: fixed;
    bottom: -30px;
    left: 50%;
    margin-left: -60px;
    width: 119px;
    height: 50px;
    border: 1px solid #666;
    border-radius: 10px 10px 0 0;
    background: rgba(50, 50, 50, 0.5);
    font-family: Arial, Helvetica, sans-serif;
    font-weight: bold;
    font-size: 12px;
    transition: bottom 0.25s;
    z-index: 999999;

    &, & * {
        touch-action: manipulation;
    }

    button {
        border: 0;
        background: transparent;
        box-shadow: none;
    }

    .title {
        pointer-events: none;
        position: absolute;
        top: 2px;
        left: -90px;
        width: 300px;
        text-align: center;
        text-shadow:
            -1px -1px 0 #999,
            1px -1px 0 #999,
            -1px 1px 0 #999,
            1px 1px 0 #999;
        transition: top 0.25s;

        &.focused {
            opacity: 0;
        }
    }

    .direction {
        pointer-events: none;
        float: left;
        height: 50px;
        margin: 0;
        padding: 0;
        opacity: 0;
        background: transparent;
        transition: opacity 0.25s;

        svg {
            width: 100%;
            height: 100%;
        }

        polygon {
            fill: #EEE;
            stroke: #000;
            stroke-width: 2px;
        }

        &.previous {
            width: 59px;
            border-right: 1px solid #666;
            transform: none;
        }

        &.next {
            width: 58px;
            transform: rotate(180deg);
        }
    }

    .open-power-nav {
        position: absolute;
        bottom: 75px;
        left: 50%;
        width: 20px;
        height: 10px;
        margin-left: -10px;
        padding: 0;
        opacity: 0;
        transition: opacity 0.25s;

        svg {
            width: 100%;
            height: 100%;
            overflow: visible;
        }

        polygon {
            fill: #EEE;
            stroke: #000;
            stroke-width: 2px;
        }
    }

    &:focus,
    &:focus-within {
        bottom: -1px;

        .title {
            top: -19px;

            &.focused {
                opacity: 1;
            }

            &.blurred {
                opacity: 0;
            }
        }

        .power-nav,
        .open-power-nav,
        button {
            pointer-events: all;
            opacity: 1;
            box-shadow: none;
        }
    }
}

.power-nav {
    pointer-events: none;
    position: absolute;
    bottom: 72px;
    left: 50%;
    width: 300px;
    height: 450px;
    margin-left: -150px;
    padding: 10px;
    border: 1px solid #666;
    border-radius: 15px;
    background: rgba(50, 50, 50, 0.5);
    text-align: center;
    opacity: 0;
    transition: opacity 0.25s;

    .title {
        position: static;
    }

    p {
        color: #EEE;
    }

    ul {
        border-top: 1px solid #666;
        border-bottom: 1px solid #666;
        width: 100%;
        height: 360px;
        padding: 5px 0;
        overflow: scroll;
    }

    li {
        padding: 2px 0;
        font-size: 16px;
        list-style: none;
        cursor: pointer;
        color: #eee;

        &.active {
            color: #4254f4;
        }
    }

    .option {
        height: 60px;
        width: 120px;
        color: #eee;
        font-size: 12px;
        font-weight: bold;
        vertical-align: top;
    }

    .close {
        position: absolute;
        top: 3px;
        right: 3px;
        width: 30px;
        height: 30px;
        font-size: 14px;
        padding: 5px;
        background: #666;
        border-radius: 15px;
    }
}
</style>
