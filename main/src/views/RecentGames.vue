<template>
<div v-if="recentGames.length" class="recent">
    <div class="constrain">
        <div class="top-items">
            <h3>{{ $t('RECENT_GAMES.TITLE') }}</h3>
            <button class="view-all" v-on:click.prevent="onPastGamesClick">
                {{ $t('RECENT_GAMES.VIEW_ALL.BUTTON') }}
            </button>
        </div>

        <PastGame
            v-for="game in recentGames"
            :key="game.artifact.url"
            :past-game="game"
            class="home"
            location="recent_game"
        />

        <a v-if="recentGames.length >= 3" class="more" href="#" v-on:click.prevent="onPastGamesClick">
            {{ $t('RECENT_GAMES.VIEW_ALL.LINK') }}
        </a>
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'

import type { Games } from '@games/games'

import PastGame from './PastGame.vue'

export default defineComponent({
    components: {
        PastGame
    },

    props: {
        recentGames: {
            type: Array as Prop<Games.PastGame[]>,
            default: () => []
        }
    },

    emits: ['pastGamesWasClicked'],

    methods: {
        onPastGamesClick() {
            this.$emit('pastGamesWasClicked')
        }
    }
})
</script>


<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

.recent {
    padding: 30px 15px;
    background: var(--backgroundSecondary);
    border-top: 1px solid var(--inputSecondary);

    .top-items {
        margin: 0 auto 15px;
        max-width: 375px;
    }

    h3 {
        display: inline-block;
        font-size: 14px;
        text-align: left;
        color: var(--textPrimary);
    }

    .view-all {
        float: right;
        width: auto;
        height: auto;
        padding: 3px 10px 2px;
        margin: 1px 0 0 0;
        background: var(--accent);
        font-size: 12px;
        box-shadow: 0 3px 0 var(--shadows);

        &:active {
            box-shadow: 0 1px 0 var(--shadows);
        }
    }

    .more {
        display: block;
        font-size: 14px;
        text-align: center;
    }
}
</style>
