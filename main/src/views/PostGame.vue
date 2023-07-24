<template>
<div class="post-game scrollable">
    <div class="header" v-text="info!.name" />
    <div class="constrain">
        <PostGameActions :player="player!" :classes="{ action: 'buttonBlack' }" />
        <GalleryLink :artifact="artifact" />
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import { GalleryLink, PostGameActions } from '@tv/vue'
import type { CommonEntities } from '@tv/shared'
import type { DrawfulAnimate } from '../DrawfulAnimate'

export default defineComponent({
    components: {
        GalleryLink,
        PostGameActions
    },

    props: {
        artifact: Object as Prop<CommonEntities.Artifact>,
        info: Object as Prop<DrawfulAnimate.Info>,
        player: Object as Prop<CommonEntities.PostGame>
    }
})
</script>

<style lang="scss">
.post-game {
    background-image: url('../images/DrawingStripesTile.png');
    text-align: center;
}

.artifact-link {
    background-image: url('../images/gallery.png');
}
</style>
