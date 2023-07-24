<template>
<div v-if="pastGame.game" class="past-game" :class="{ managing: isManaging, confirming: showConfirm }">
    <a class="card" :href="pastGame.artifact.url" target="_blank" v-on:click="onClick">
        <div class="image" :class="imageClasses">
            <img
                v-if="hasPreviews"
                ref="image" :src="imageSrc" :alt="pastGame.artifact.gameName"
                v-on:error="onImageError"
                v-on:load="onImageLoad"
            >
        </div>

        <p class="cta">
            {{ cta }}
            <svg viewBox="0 0 200 200" class="external-icon">
                <path
                    d="M185,106c-8.3,0-15,6.7-15,15v44c0,2.8-2.2,5-5,5H35c-2.8,0-5-2.2-5-5V35c0-2.8,2.2-5,5-5h44c8.3,0,15-6.7,15-15
                       S87.3,0,79,0H35C15.7,0,0,15.7,0,35v130c0,19.3,15.7,35,35,35h130
                       c19.3,0,35-15.7,35-35v-44C200,112.7,193.3,106,185,106z"
                />
                <path
                    d="M184,0h-54c-8.3,0-15,6.7-15,15s6.7,15,15,15h18.8L90.4,88.4c-5.9,5.9-5.9,15.4,0,21.2c2.9,2.9,6.8,4.4,10.6,4.4
                        s7.7-1.5,10.6-4.4L170,51.2V70c0,8.3,6.7,15,15,15s15-6.7,15-15V16C200,7.2,192.8,0,184,0z"
                />
            </svg>
        </p>

        <div class="content">
            <p class="name">{{ name }}</p>
            <p class="date"><span>{{ $t('PAST_GAME.PLAYED_ON') }}</span>{{ pastGame.artifact.date }}</p>
        </div>

        <p v-if="!viewed && !pastGame.artifact.viewed" class="new">{{ $t('PAST_GAME.NEW') }}</p>
    </a>

    <div v-if="pastGame.game.shopItems && pastGame.game.shopItems.length" class="items">
        <div v-for="item in pastGame.game.shopItems" :key="item" class="item">
            <svg v-if="item === 'cards'" viewBox="0 0 200 200">
                <path
                    d="M187.4,47.8l-34.1-15.9V29c0-8.8-7.2-16-16-16H57.8c-8.8,0-16,7.2-16,16v18.9L13.6,61.1c-3.9,1.8-6.8,5-8.3,9
                    c-1.5,4-1.3,8.4,0.5,12.2l45,96.4c1.8,3.9,5,6.8,9,8.3c1.8,0.6,3.6,1,5.5,1c2.3,0,4.6-0.5,6.8-1.5l42.7-19.9l14.2,6.6
                    c2.2,1,4.5,1.5,6.7,1.5c6,0,11.8-3.4,14.5-9.2l45-96.4C198.9,61,195.4,51.5,187.4,47.8z M133.4,91.7L107,35.2
                    c-0.4-0.8-0.8-1.5-1.2-2.1h27.6V91.7z M61.8,33h12l-12,5.6V33z M67.2,166.7L25.7,77.5l64.9-30.3l41.6,89.2l-21.7,10.1
                    c0,0,0,0,0,0L67.2,166.7z M153.4,111.4V54l22,10.3L153.4,111.4z"
                />
            </svg>
            <svg v-else-if="item === 'mugs'" viewBox="0 0 200 200">
                <path
                    d="M164.7,52.2h-20.7V35.5c0-6.2-5-11.2-11.2-11.2H47.6c-6.2,0-11.2,5-11.2,11.2v118c0,12.8,10.4,23.2,23.2,23.2h61.3
                       c12.8,0,23.2-10.4,23.2-23.2v-16.2h20.7c14.3,0,25.9-11.6,25.9-25.9V78.1C190.7,63.8,179,52.2,164.7,52.2z
                       M174.2,111.4c0,5.2-4.3,9.5-9.5,9.5h-20.7V68.6h20.7c5.2,0,9.5,4.3,9.5,9.5V111.4z"
                />
            </svg>
            <svg v-else-if="item === 'shirts'" viewBox="0 0 200 200">
                <path
                    d="M145.5,184.5H55.5c-4.1,0-7.5-3.4-7.5-7.5V95.2H29.6c-3.3,0-6.2-2.1-7.2-5.2L10,50.5c-1.2-3.7,0.7-7.7,4.3-9.2
                       L72.5,17c1.8-0.7,3.8-0.8,5.6-0.1c0.1,0,6.3,15.1,22.4,15.1S122.7,17,122.9,17c1.8-0.7,3.8-0.7,5.6,0.1l58.2,24.2
                       c3.6,1.5,5.4,5.5,4.3,9.2L178.5,90c-1,3.1-3.9,5.2-7.2,5.2H153V177C153,181.2,149.7,184.5,145.5,184.5z"
                />
            </svg>
        </div>
    </div>

    <transition name="fade-transition">
        <div v-if="showConfirm" class="confirm">
            <div class="contain">
                <p>
                    <span>{{ $t('PAST_GAME.REMOVE.TITLE') }}</span>
                    {{ $t('PAST_GAME.REMOVE.DESCRIPTION') }}
                </p>
                <button class="confirm-yes" v-on:click="$emit('remove', index!)">{{ $t('ACTION.REMOVE') }}</button>
                <button class="confirm-no" v-on:click="onCancelClick">{{ $t('ACTION.CANCEL') }}</button>
            </div>
        </div>
    </transition>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import { Analytics, Artifacts } from '@tv/shared'

import type { Games } from '@games/games'

export default defineComponent({
    props: {
        pastGame: {
            type: Object as Prop<Games.PastGame>,
            required: true
        },
        isManaging: Boolean,
        index: Number,
        location: String as Prop<Analytics.GalleryClickLocation>
    },

    emits: {
        remove: (_: number) => true
    },

    data() {
        return {
            viewed: false,
            status: 'loading',
            showConfirm: false
        }
    },

    computed: {
        cta() {
            if (this.pastGame.game!.shopItems?.length) return this.$t('PAST_GAME.CALL_TO_ACTION.SHOP')
            return this.$t('PAST_GAME.CALL_TO_ACTION.VIEW')
        },

        hasPreviews() {
            return this.pastGame.game!.features?.includes('previews') ?? false
        },

        imageClasses() {
            if (this.status === 'error' || !this.hasPreviews) {
                return ['fallback', this.pastGame.artifact.gameName]
            }

            if (this.status === 'success') {
                return ['preview']
            }

            return []
        },

        imageSrc() {
            // eslint-disable-next-line max-len
            return `https://s3.amazonaws.com/jbg-blobcast-artifacts/${this.pastGame.artifact.gameName}/${this.pastGame.artifact.id}/preview.png`
        },

        name() {
            if (this.showConfirm) return this.$t('PAST_GAME.REMOVE.CONFIRM')
            if (this.isManaging) return this.$t('PAST_GAME.REMOVE.MANAGE')
            return this.pastGame.game!.name ?? ''
        }
    },

    watch: {
        isManaging() {
            this.showConfirm = false
        }
    },

    mounted() {
        Analytics.galleryImpression(this.pastGame.artifact.categoryId, this.location!)
    },

    methods: {
        onImageLoad() {
            this.status = 'success'
        },

        onImageError() {
            this.status = 'error'
        },

        onClick(event: MouseEvent) {
            if (this.isManaging) {
                event.preventDefault()
                this.showConfirm = true
                return
            }

            Artifacts.setAsViewed(this.index!)
            this.viewed = true

            Analytics.galleryClick(this.pastGame.artifact.categoryId, this.location!)
        },

        onCancelClick() {
            this.showConfirm = false
        }
    }
})
</script>


<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

.past-game {
    position: relative;
    margin: 0 auto 20px;
    max-width: 375px;
    transform: translateZ(0);
}

.card {
    position: relative;
    display: block;
    width: 100%;
    background: #FFF;
    border: 4px solid #FFF;
    border-radius: 14px;
    box-shadow: 0 5px 0 0 var(--shadows);
    overflow: hidden;
    font-weight: bold;
    transform: translateY(0);
    transition: 0.25s box-shadow, 0.25s transform, 0.1s color, 0.1s border-color;

    &:hover {
        box-shadow: 0 10px 0 0 var(--shadows);
        transform: translateY(-2px);
    }
}

.image {
    position: relative;
    width: 100%;
    padding-top: 50%; // aspect-ratio
    background: jbg.$grayDark;
    overflow: hidden;

    img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
    }

    &.fallback {
        background-position: center;
        background-size: cover;

        img {
            display: none;
        }
    }

    &.quiplash2-internationalGame { background-image: url("../images/past-games/quiplash_2-int.jpg"); }
    &.DrawfulGame { background-image: url("../images/past-games/drawful_2.jpg"); }
    &.TeeKOGame { background-image: url("../images/past-games/teeko.jpg"); }
    &.Quiplash2Game { background-image: url("../images/past-games/quiplash_2.jpg"); }
    &.TriviaDeathResults { background-image: url("../images/past-games/trivia_murder_party.jpg"); }
    &.STIGame { background-image: url("../images/past-games/survive_the_internet.png"); }
    &.MonsterMingleGame { background-image: url("../images/past-games/monster_seeking_monster.png"); }
    &.BRKGame { background-image: url("../images/past-games/bracketeering.png"); }
    &.OverdrawnGame { background-image: url("../images/past-games/civic_doodle.png"); }
    &.YDKJ2018Game { background-image: url("../images/past-games/ydkj-full_stream.png"); }
    &.SplitTheRoomGame { background-image: url("../images/past-games/split_the_room.png"); }
    &.RapBattleGame { background-image: url("../images/past-games/mad_verse_city.png"); }
    &.SlingShootGame { background-image: url("../images/past-games/zeeple_dome.png"); }
    &.PatentlyStupidGame { background-image: url("../images/past-games/patently_stupid.png"); }
    &.TriviaDeath2Game { background-image: url("../images/past-games/trivia_murder_party_2.png"); }
    &.RoleModelsGame { background-image: url("../images/past-games/role_models.png"); }
    &.JokeboatGame { background-image: url("../images/past-games/joke_boat.png"); }
    &.RidictionaryGame { background-image: url("../images/past-games/dictionarium.png"); }
    &.PushTheButtonGame { background-image: url("../images/past-games/push_the_button.png"); }
    &.JackboxTalksGame { background-image: url("../images/past-games/talking_points.png"); }
    &.quiplash3Game { background-image: url("../images/past-games/quiplash_3.jpg"); }
    &.EverydayGame { background-image: url("../images/past-games/devils.jpg"); }
    &.WorldChampionsGame { background-image: url("../images/past-games/champed_up.jpg"); }
    &.BlankyBlankGame { background-image: url("../images/past-games/blather_round.jpg"); }
    &.DrawfulAnimateGame { background-image: url("../images/past-games/drawful-animate.png"); }
    &.TheWheelGame { background-image: url("../images/past-games/the-wheel.png"); }
    &.JobGameGame { background-image: url("../images/past-games/jobjob.png"); }
    &.SurveyBombGame { background-image: url("../images/past-games/poll_mine.jpg"); }
    &.MurderDetectivesGame { background-image: url("../images/past-games/weapons-drawn.png"); }
    &.AntiqueGameGame { background-image: url("../images/past-games/antique_freak.png"); }
    &.Fibbage4Game { background-image: url("../images/past-games/fibbage_4.jpg"); }
    &.MakeFriendsGame { background-image: url("../images/past-games/roomerang.png"); }
    &.RangeGameGame { background-image: url("../images/past-games/nonsensory.jpg"); }
    &.LineupGame { background-image: url("../images/past-games/quixort.jpg"); }
}

.content {
    width: 100%;
    padding: 5px 8px 0;
    overflow: hidden;
}

.cta {
    position: absolute;
    top: -2px;
    left: 50%;
    padding: 0 10px;
    background: #FFF;
    border-radius: 0 0 5px 5px;
    color: jbg.$blueDarker;
    font-size: 12px;
    white-space: nowrap;
    transform: translateX(-50%);
    transition: opacity 0.1s;

    svg {
        position: relative;
        top: 1px;
        width: 11px;
        height: 11px;
        margin-left: 1px;
        fill: jbg.$blueDarker;
    }
}

.name {
    float: left;
    width: 75%;
    padding-top: 3px;
    color: jbg.$blueDarker;
    font-size: 14px;
    text-transform: uppercase;
    transition: color 0.1s;
    line-height: 1.3;
}

.date {
    float: right;
    width: 25%;
    color: #0d1c2b;
    font-size: 12px;
    line-height: 1.2;
    text-align: right;

    span {
        display: block;
        color: #0a1420;
        font-size: 8px;
    }
}

.new {
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    padding: 55px 0 1px;
    background: transparentize($color: #0a1420, $amount: 0.15);
    color: #FFF;
    font-size: 12px;
    text-align: center;
    transform: translate(-50%, -50%) rotate(-45deg);
    transition: opacity 0.1s;

    &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        margin-top: 10px;
        margin-left: -4px;
        width: 8px;
        height: 8px;
        background: jbg.$alert;
        border-radius: 4px;
    }
}

.items {
    pointer-events: none;
    position: absolute;
    top: -4px;
    right: -4px;
    transition: opacity 0.1s;
}

.item {
    float: right;
    width: 40px;
    height: 40px;
    padding: 7px;
    margin-left: -10px;
    background: jbg.$blueDarker;
    border-radius: 20px;
    transform: rotate(15deg);

    svg {
        fill: #FFF;
    }
}

.confirm {
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 32px;
    border-radius: 9px 9px 0 0;
    background: rgba(0, 0, 0, 0.9);
    text-align: center;
    transition: opacity 0.15s;

    .contain {
        position: absolute;
        top: 50%;
        left: 0;
        width: 100%;
        transform: translateY(-50%);
    }

    p {
        color: jbg.$offWhite;
        font-weight: normal;
        font-size: 13px;
        line-height: 1.3;

        span {
            display: block;
            font-weight: bold;
            font-size: 16px;
        }
    }

    button {
        display: block;
        width: 120px;
        height: auto;
        max-width: 80%;
        padding: 5px 0;
        margin: 8px auto 0;
        box-shadow: none;
        font-size: 14px;

        &.confirm-yes {
            background: jbg.$alert;
            color: jbg.$offWhite;
        }

        &.confirm-no {
            background: jbg.$offWhite;
            color: jbg.$grayDark;
        }
    }
}

.fade-transition-enter,
.fade-transition-leave-to {
    opacity: 0;
}


// Managing

.past-game.managing {
    .new, .items, .cta {
        opacity: 0;
    }

    .name {
        color: jbg.$alert;
    }
}


// Confirm

.past-game.managing.confirming {
    .card {
        background: jbg.$alert;
        border-color: jbg.$alert;
    }

    .name {
        color: jbg.$offWhite;
    }

    .date {
        color: jbg.$offWhite;

        span {
            color: jbg.$offWhite;
        }
    }
}
</style>
