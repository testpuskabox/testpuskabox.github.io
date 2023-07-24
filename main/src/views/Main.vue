<template>
<Fatal v-if="shouldShowFatal" />
<div v-else class="jbg schemable sign-in" :class="classes">
    <TopBar
        ref="topBar"
        :twitch="twitch"
        :artifacts="artifacts"
        v-on:twitch-login-was-clicked="onTwitchLoginClick"
        v-on:twitch-logout-was-clicked="onTwitchLogoutClick"
    />

    <div class="form">
        <div class="constrain">
            <Connect
                :match="options!.match"
                :twitch-user="twitch.user"
                v-on:twitch-login-was-clicked="onTwitchLoginClick"
            />

            <SlideBanner />

            <a
                v-if="!recentGames.length"
                class="bottom-logo"
                target="_blank"
                href="https://www.jackboxgames.com/?utm_source=jackboxtv&utm_medium=logo&utm_campaign=jackboxgames"
            >
                {{ $t('HOMEPAGE_LINK') }}
            </a>
        </div>
    </div>

    <RecentGames
        :recent-games="recentGames"
        v-on:past-games-was-clicked="onPastGamesClick"
    />

    <Modal />
</div>
</template>


<script lang="ts">
import { defineComponent, inject } from 'vue'

import { Artifacts, Storage, Twitch } from '@tv/shared'
import { InjectionKeys } from '@tv/vue'
import type { TV } from '@tv/loader'

import { getGame } from '@games/games'

import Connect from './Connect.vue'
import RecentGames from './RecentGames.vue'
import SlideBanner from './SlideBanner.vue'
import TopBar from './TopBar.vue'

export default defineComponent({
    // eslint-disable-next-line vue/component-definition-name-casing
    name: '@connect',

    components: {
        Connect,
        TopBar,
        RecentGames,
        SlideBanner
    },

    props: {
        options: Object as Prop<TV.LoadOptions>
    },

    // Typesafe injections are only available in the composition api
    setup() {
        return {
            fatalError: inject(InjectionKeys.fatal.error)
        }
    },


    data() {
        return {
            artifacts: new Artifacts(),
            theme: Storage.get('preference:theme') || 'device',
            twitch: new Twitch(this.options!.match!.hashString)
        }
    },

    computed: {
        classes() {
            const classes = [
                `locale-${this.$i18n.locale}`,
                `theme-${this.theme}`
            ]

            if (this.recentGames.length) classes.push('has-recent')
            return classes
        },

        recentGames() {
            return this.artifacts?.artifacts?.slice(0, 3)
                .map((artifact) => ({
                    artifact,
                    game: getGame(artifact.categoryId)
                }))
                // Ignore artifacts whose categoryIds don't match a known game
                .filter((artifact) => artifact.game)
        },

        shouldShowFatal() {
            return this.fatalError?.hasCrashed ?? false
        }
    },

    watch: {
        theme: {
            immediate: true,
            handler: function styleCookieConsentBanner() {
                // The vanilla-cookieconsent library supports dark mode, but
                // through a class on the document. If a player changes their
                // theme preference, ensure this cookie banner follows suit!
                if (
                    this.theme === 'dark'
                    || window.matchMedia('(prefers-color-scheme: dark)').matches
                ) {
                    document.documentElement.classList.add('cc--darkmode')
                } else {
                    document.documentElement.classList.remove('cc--darkmode')
                }
            }
        }
    },

    beforeMount() {
        void this.setupTwitch()
        window.addEventListener('themedidchange', this.onThemeChange)
    },

    mounted() {
        this.checkForPastGamesUrl()
    },

    beforeUnmount() {
        window.removeEventListener('themedidchange', this.onThemeChange)

        // Stow cookie consent banner if someone rushes into a game
        this.$cc.hide()
    },

    methods: {
        setupTwitch() {
            void this.twitch.prepare()
        },

        onTwitchLoginClick() {
            this.twitch.login()
        },

        onTwitchLogoutClick() {
            this.twitch.logout()
        },

        onPastGamesClick() {
            const topBarComponent = this.$refs.topBar as InstanceType<typeof TopBar>
            topBarComponent.$data.openedTo = 'pastGames'
        },

        onThemeChange(_: Event) {
            this.theme = Storage.get('preference:theme') || 'device'
        },

        // if a url is /past-games or /past-games/<game>
        // we open past games optionally filtered.
        checkForPastGamesUrl() {
            const match = this.options?.match
            if (!match) return
            if (!match.url.includes('past-games')) return

            const topBarComponent = this.$refs.topBar as InstanceType<typeof TopBar>

            if (match.data?.game) {
                topBarComponent.$data.pastGamesFilter = match.data.game
            }

            topBarComponent.$data.openedTo = 'pastGames'
        }
    }
})
</script>

<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

.jbg.sign-in {
    height: 100%;
    overflow-y: auto;

    &.has-recent {
        background: var(--backgroundSecondary);
    }
}

.form {
    background: var(--backgroundPrimary);
    padding-bottom: 30px;

    select {
        text-transform: none;
    }
}

label {
    .status {
        float: right;
        font-size: 14px;
        font-weight: normal;
        font-style: italic;
    }

    .remaining {
        float: right;
    }
}

.warnings {
    padding: 0 10px 15px;

    p {
        font-size: 11px;
        text-align: center;
    }
}

a.bottom-logo {
    cursor: pointer;
    display: block;
    width: 50%;
    height: 50px;
    max-width: 320px;
    margin: 20px auto;
    color: transparent;
    background-image: url("../images/jbg-bottom-logo.svg");
    background-size: contain;
    background-position: top center;
    background-repeat: no-repeat;
}
</style>
