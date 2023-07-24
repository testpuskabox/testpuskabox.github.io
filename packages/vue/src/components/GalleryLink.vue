<template>
<a
    v-if="link"
    :class="{ 'no-content': !hasProvidedContent }"
    class="artifact-link"
    target="_blank"
    :href="link"
    :aria-label="$t('POST_GAME.GALLERY_LINK')"
    v-on:click="onLinkClick"
>
    <slot />
</a>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Analytics, Artifacts, CommonEntities } from '@tv/shared'

export default defineComponent({
    props: {
        artifact: Object as Prop<CommonEntities.Artifact>
    },

    computed: {
        link(): string | undefined {
            if (!this.artifact) return

            const scheme = this.artifact.rootId.includes('test')
                ? 'http'
                : 'https'
            const domain = this.artifact.rootId.includes('test')
                ? 'games-test.jackbox.tv'
                : 'games.jackbox.tv'

            return `${scheme}://${domain}/artifact/${this.artifact.categoryId}/${this.artifact.artifactId}/`
        },

        hasProvidedContent(): boolean {
            return this.$slots.default !== undefined
        }
    },

    mounted() {
        Analytics.galleryImpression(this.artifact!.categoryId, 'post_game')
    },

    methods: {
        onLinkClick() {
            Analytics.galleryClick(this.artifact!.categoryId, 'post_game')
            Artifacts.setAsViewed(0)
        }
    }
})
</script>


<style lang="scss">
.artifact-link {
    display: inline-block;
    width: 100%;

    &.no-content {
        padding-bottom: 50%;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }
}
</style>
