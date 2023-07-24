<template>
<div v-if="artifacts" class="past-games">
    <div class="constrain">
        <div v-if="pastGames && pastGames.length" class="top-items">
            <h3>{{ $t('PAST_GAMES.TITLE') }}</h3>
            <button class="manage" v-on:click="onManage">
                {{ isManaging ? $t('ACTION.DONE') : $t('PAST_GAMES.MANAGE') }}
            </button>
        </div>
        <p v-else class="empty">{{ $t('PAST_GAMES.EMPTY') }}</p>

        <transition-group name="list-transition">
            <PastGame
                v-for="pastGame, index in pastGames"
                :key="pastGame.artifact.url"
                :past-game="pastGame"
                :index="index"
                :is-managing="isManaging"
                location="past_game"
                v-on:remove="onRemove"
            />
        </transition-group>
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'

import type { Artifacts } from '@tv/shared'

import { getGame } from '@games/games'
import type { Games } from '@games/games'

import PastGame from './PastGame.vue'

export default defineComponent({
    components: {
        PastGame
    },

    props: {
        artifacts: Object as Prop<Artifacts>,
        filter: String as Prop<string|null>
    },

    data() {
        return {
            isManaging: false
        }
    },

    computed: {
        pastGames(): Games.PastGame[] {
            if (!this.artifacts?.artifacts) return []

            const pastGames: Games.PastGame[] = this.artifacts.artifacts.map((artifact) => ({
                artifact,
                game: getGame(artifact.categoryId)
            }))

            return pastGames.filter((pastGame) => {
                if (!pastGame.game) return false
                if (this.filter) {
                    if (this.filter === pastGame.game.tag) return true
                    if (this.filter === pastGame.game.categoryId) return true
                    return false
                }
                return true
            })
        }
    },

    methods: {
        onManage() {
            this.isManaging = !this.isManaging
        },

        onRemove(index: number) {
            this.artifacts!.remove(index)
        }
    }
})
</script>


<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

.constrain {
    min-height: auto;
    padding: 0 15px;
}

.top-items {
    margin: 15px auto 10px;
    max-width: 375px;

    h3 {
        display: inline-block;
        font-size: 14px;
        text-align: left;
        color: #FFF;
    }

    .manage {
        float: right;
        width: auto;
        height: auto;
        padding: 3px 10px 2px;
        margin: 0;
        background: jbg.$blueDarker;
        font-size: 12px;
        box-shadow: none;
    }
}

.empty {
    color: #FFF;
    margin: 30px 0;
    text-align: center;
    font-size: 16px;
}

.data {
    margin: 25px 0 10px;
    padding-top: 15px;
    border-top: 1px solid jbg.$blueDarker;
    text-align: center;

    button {
        background: jbg.$blueDarker;
        box-shadow: none;
        height: auto;
        padding: 10px;
        margin: 0 0 10px;
        font-size: 14px;
    }
}


// Transitions

.list-transition-enter-active,
.list-transition-leave-active {
    transition: opacity 0.25s;
}

.list-transition-enter,
.list-transition-leave-to {
    opacity: 0;
}
</style>
