<template>
<div class="waiting" :class="{ isFriendMode: player!.isFriendMode }">
    <div class="header" v-text="header" />
    <div class="constrain stacked">
        <div v-if="player!.message" class="message" v-text="player!.message" />
        <div class="logo" />
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import type { DrawfulAnimate } from '../DrawfulAnimate'

export default defineComponent({
    props: {
        info: Object as Prop<DrawfulAnimate.Info>,
        player: Object as Prop<DrawfulAnimate.Waiting.Entity>
    },

    computed: {
        header(): string {
            if (this.player && this.player.header) return this.player.header
            if (this.info && this.info.name) return this.info.name
            return this.$ecast.name
        }
    }
})
</script>

<style lang="scss">
.waiting {
    height: 100%;
    .message {
        text-align: center;
    }

    .stacked {
        display: flex;
        flex-flow: column nowrap;
        height: 100%;
        > div {
            flex: 0 0 auto;
        }
        > .logo {
            flex: 1 0 auto;
            background-image: url(../images/logo.png);
            background-position: center;
            background-repeat: no-repeat;
            background-size: contain;
        }
    }
    &.isFriendMode {
        background-image: url(../images/LobbyFriendModeStripesTile.png);
        .logo {
            background-image: url(../images/FriendModeLogo.png);
        }
    }
}
</style>
