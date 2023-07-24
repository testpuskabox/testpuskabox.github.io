<template>
<nav class="nav">
    <ul>
        <li v-if="!isTwitchAuthenticated" class="twitch">
            <a
                v-on:keyup.enter="onTwitchLoginClick"
                v-on:click.prevent="onTwitchLoginClick"
            >{{ $t('MENU.TWITCH') }}</a>
        </li>
        <li
            v-else class="twitch"
            v-on:keyup.enter="onTwitchLogoutClick"
            v-on:click.prevent="onTwitchLogoutClick"
        >
            <a href="#">{{ $t('MENU.LOGOUT') }}</a>
        </li>
        <li class="moderator">
            <a href="/moderator">{{ $t('MENU.MODERATOR') }}</a>
        </li>
        <li>
            <a href="http://help.jackboxgames.com" target="_blank" v-on:click="onLinkClick('help')">
                {{ $t('MENU.HELP') }}
            </a>
        </li>
        <li>
            <a href="https://shop.jackboxgames.com" target="_blank" v-on:click="onLinkClick('merch')">
                {{ $t('MENU.MERCH') }}
            </a>
        </li>
        <li>
            <a
                v-on:keyup.enter="onPastGamesClick"
                v-on:click.prevent="onPastGamesClick"
            >
                {{ $t('MENU.PAST_GAMES') }}
                <div v-if="hasUnseenGames" class="indicator" />
            </a>
        </li>
        <!-- TODO: Reactivate when we have a valid ActiveCampaign mailing list link! -->
        <!-- <li>
            <a
                href="https://jackboxgames.us7.list-manage.com/subscribe?u=a181fa3b606c035e1cee11b76&id=eb7f0081d6"
                target="_blank"
                v-on:click="onLinkClick('mailinglist')"
            >
                {{ $t('MENU.MAILING_LIST') }}
            </a>
        </li> -->
        <AppearanceRadio />
        <PreferredBranch v-if="shouldShowPreferredBranch" />
        <li class="social">
            <a
                class="facebook"
                aria-label="facebook"
                target="_blank"
                href="https://www.facebook.com/JackboxGames"
                v-on:click="onLinkClick('https://www.facebook.com/JackboxGames')"
            />
            <a
                class="twitter"
                aria-label="twitter"
                target="_blank"
                href="https://twitter.com/jackboxgames"
                v-on:click="onLinkClick('https://twitter.com/jackboxgames')"
            />
            <a
                class="instagram"
                aria-label="instagram"
                target="_blank"
                href="https://www.instagram.com/playjackboxgames"
                v-on:click="onLinkClick('https://www.instagram.com/playjackboxgames')"
            />
        </li>
        <li class="version">
            <a href="/manifest">{{ version }}</a>
        </li>
    </ul>
</nav>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import { Analytics, Twitch } from '@tv/shared'
import AppearanceRadio from './AppearanceRadio.vue'
import PreferredBranch from './PreferredBranch.vue'

export default defineComponent({
    components: {
        AppearanceRadio,
        PreferredBranch
    },

    props: {
        hasUnseenGames: Boolean,
        twitch: Object as Prop<Twitch>
    },

    emits: [
        'pastGameWasClicked',
        'twitchLoginWasClicked',
        'twitchLogoutWasClicked'
    ],

    computed: {
        shouldShowPreferredBranch() {
            return window.tv.manifest.environment !== 'production'
        },

        version() {
            return window.tv.manifest.loader.version
        },

        isTwitchAuthenticated() {
            return this.twitch!.user !== undefined
        }
    },

    methods: {
        onPastGamesClick() {
            this.$emit('pastGameWasClicked')
        },

        onTwitchLoginClick() {
            this.$emit('twitchLoginWasClicked')
        },

        onTwitchLogoutClick() {
            this.$emit('twitchLogoutWasClicked')
        },

        onLinkClick(url: string) {
            Analytics.externalLinkClick(url, 'hamburger')
        }
    }
})
</script>


<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

.nav {
    ul {
        min-width: 300px;
        max-width: 350px;
        margin: 25px auto;
        list-style: none;
    }

    li {
        cursor: pointer;
        text-align: center;
        opacity: 0;
        animation: fade-animation 0.5s forwards;

        @for $i from 1 through 10 {
            &:nth-child(#{$i}) {
                animation-delay: $i * 0.05s;
            }
        }
    }

    li.version {
        padding: 0;

        a {
            position: relative;
            display: inline;
            width: auto;
            border: none;
            background-color: transparent;
            font-size: 13px;
            font-weight: 400;
            color: white;
        }
    }

    a {
        position: relative;
        display: block;
        width: 210px;
        margin: 9px auto;
        padding: 10px 0px;
        border-radius: 14px;
        border: 4px solid #c7c7c7;
        background-color: #fff;
        font-size: 18px;
        color: jbg.$grayDark;
        text-decoration: none;
        transition: border-color 0.25s;

        &:active,
        &:hover,
        &:focus {
            border-color: #fff;
        }
    }

    li.twitch a {
        color: #fff;
        padding-left: 25px;
        border: 5px solid #fff;
        background-color: jbg.$twitch;
        background-image: url("../images/icon-twitch.svg");
        background-size: 25px 25px;
        background-repeat: no-repeat;
        background-position: 45px 13px;
        transition: background-color 0.25s;

        &:active {
            background-color: jbg.$twitchDark;
        }
    }

    li.moderator a {
        color: #fff;
        border: 5px solid #fff;
        background-color: jbg.$blueDarker;
        transition: background-color 0.25s;

        &:active {
            background-color: jbg.$blueDark;
        }
    }

    li.social a {
        display: inline-block;
        width: 40px;
        height: 40px;
        margin: 7px 10px;
        border: none;
        border-radius: 10px;
        background-size: contain;
        background-repeat: no-repeat;
        background-color: transparent;

        &.facebook {
            background-image: url("../images/icon-facebook.svg");
        }

        &.twitter {
            background-image: url("../images/icon-twitter.svg");
        }

        &.instagram {
            background-image: url("../images/icon-instagram.svg");
        }
    }

    li a .indicator {
        width: 24px;
        height: 24px;
        top: -10px;
        left: auto;
        right: -10px;
        border: 4px solid jbg.$blueDark;
    }
}

@keyframes fade-animation {
    0% { opacity: 0; }
    100% { opacity: 1; }
}
</style>
