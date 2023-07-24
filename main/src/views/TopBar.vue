<template>
<div v-if="twitch" class="top-bar">
    <header
        class="header"
        v-on:keyup.enter="onHamburgerClick"
        v-on:click="onHamburgerClick"
    >
        <div class="constrain">
            <div class="logo" />
            <div class="hamburger" :class="{ close: openedTo !== null }" />
            <div v-if="!openedTo && hasUnseenGames" class="indicator" />
            <div
                v-if="twitch.user"
                class="avatar"
                :style="`background-image: url(${twitch.user.profile_image_url});`"
            />
        </div>
    </header>

    <transition name="open-transition">
        <transition-group v-if="openedTo" tag="div" class="screen-container" name="screen-transition">
            <PastGames
                v-if="openedTo === 'pastGames'"
                key="pastGames"
                class="screen"
                :artifacts="artifacts"
                :filter="pastGamesFilter"
            />
            <HamburgerMenu
                v-if="openedTo === 'menu'"
                key="menu"
                class="screen"
                :has-unseen-games="hasUnseenGames"
                :twitch="twitch"
                v-on:past-game-was-clicked="onPastGamesClick"
                v-on:twitch-login-was-clicked="onTwitchLoginClick"
                v-on:twitch-logout-was-clicked="onTwitchLogoutClick"
            />
        </transition-group>
    </transition>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import type { Artifacts, Twitch } from '@tv/shared'
import HamburgerMenu from './HamburgerMenu.vue'
import PastGames from './PastGames.vue'

export default defineComponent({
    components: {
        HamburgerMenu,
        PastGames
    },

    props: {
        artifacts: Object as Prop<Artifacts>,
        twitch: Object as Prop<Twitch>
    },

    emits: [
        'twitchLoginWasClicked',
        'twitchLogoutWasClicked'
    ],

    data() {
        return {
            openedTo: <null|'menu'|'pastGames'> null,
            pastGamesFilter: <string|null> null
        }
    },

    computed: {
        hasUnseenGames(): boolean {
            if (!this.artifacts!.artifacts.length) return false
            return this.artifacts!.hasUnviewed
        }
    },

    methods: {
        onHamburgerClick() {
            this.openedTo = !this.openedTo ? 'menu' : null
            this.pastGamesFilter = null
        },

        onPastGamesClick() {
            this.openedTo = 'pastGames'
        },

        onTwitchLoginClick() {
            this.$emit('twitchLoginWasClicked')
        },

        onTwitchLogoutClick() {
            this.$emit('twitchLogoutWasClicked')
            this.openedTo = null
        }
    }
})
</script>


<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

.jbg.top-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
}

.header {
    position: absolute;
    top: 0;
    left: 0;
    height: 50px;
    width: 100%;
    padding: 12px 15px;
    background: jbg.$blue;
    user-select: none;
    color: #fff;
    z-index: 100;

    .logo {
        width: 100%;
        height: 28px;
        background-image: url("../images/jbg-header-logo.svg");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
    }

    .hamburger {
        cursor: pointer;
        position: absolute;
        top: 5px;
        width: 24px;
        height: 20px;
        background-image: url("../images/hamburger-sprite.png");
        background-size: 576px 20px;
        background-position: 0 0;
        background-repeat: no-repeat;
        transition: background-position 0.45s steps(23);

        &.close {
            background-position: -552px 0;
        }
    }

    .avatar {
        position: absolute;
        top: -2px;
        right: 0;
        width: 29px;
        height: 29px;
        background-size: cover;

        &::after {
            content: "";
            position: absolute;
            top: -3px;
            left: -4px;
            width: 35px;
            height: 40px;
            background-image: url("../images/twitch-avatar.png");
            background-size: cover;
        }
    }
}

.screen-container {
    position: absolute;
    top: 50px;
    left: 0;
    width: 100%;
    height: calc(100% - 50px);
    padding: 0 15px;
    background-color: jbg.$blueDark;
    overflow-y: auto;
    z-index: 99;
    transition: height 0.45s;
}

.screen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
}

:deep(.indicator) {
    position: absolute;
    width: 18px;
    height: 18px;
    top: 0px;
    left: 16px;
    background-color: jbg.$alert;
    border: 3px solid jbg.$blue;
    border-radius: 50%;
    z-index: 1;
}


// Transitions

.open-transition-enter-active,
.open-transition-leave-active {
    overflow: hidden;
    transition: height 0.45s;
}

.open-transition-enter,
.open-transition-leave-to {
    height: 0px;
}

.screen-transition-enter-active,
.screen-transition-leave-active {
    transition: opacity 0.25s;
}

.screen-transition-enter,
.screen-transition-leave-to {
    opacity: 0;
}
</style>
