<template>
<div class="slide-banner">
    <div v-if="isLoading" class="loading">{{ $t('LOADING') }}</div>
    <swiper-container
        v-if="!isLoading && banners.length"
        :autoplay-delay="5000"
        :autoplay-disable-on-interaction="false"
        :centered-slides="true"
        edge-swipe-detection="prevent"
        :loop="true"
        :pagination="true"
        :slides-per-view="1.5"
    >
        <swiper-slide v-for="banner in banners" :key="banner.url" class="slide">
            <button v-on:click="onClick(banner)">
                <img :src="banner.image" draggable="false" alt="Advert">
                <p>{{ banner.text }}</p>
            </button>
        </swiper-slide>
    </swiper-container>
</div>
</template>


<script lang="ts">
import { Analytics, Storage } from '@tv/shared'
import { defineComponent } from 'vue'

interface Banner {
    url: string
    image: string
    text: string
}

interface JSONBanner {
    href: string
    src: string
    text: string
    start?: string
    end?: string
    tags?: string[]
}

export default defineComponent({
    data() {
        return {
            isLoading: false,
            banners: <Banner[]> []
        }
    },

    mounted() {
        void this.load()
    },

    methods: {
        async load() {
            try {
                const response = await fetch(`${import.meta.env.TV_CDN}/banners.json`)
                const json = await response.json()
                const bannerJSON = (json?.bannerAds as JSONBanner[]) ?? []

                this.banners = bannerJSON.filter(this.isValidBanner.bind(this)).map((banner) => ({
                    url: banner.href,
                    image: banner.src,
                    text: banner.text
                }))

                if (!this.banners.length) {
                    this.showDefault()
                }
            } catch (error) {
                this.showDefault()
                console.warn('[SlideBanner] Could not load or parse banner data', error)
            } finally {
                this.isLoading = false
            }
        },

        showDefault() {
            this.banners = [{
                // eslint-disable-next-line max-len
                url: 'https://www.jackboxgames.com/party-pack-seven/?utm_source=jbgtv&utm_medium=jbgtvpp7&utm_campaign=jbgtvpp7',
                image: 'https://s3.amazonaws.com/static.jackboxgames.com/banners/PP7.png',
                text: 'AVAILABLE NOW!'
            }]
        },

        isValidBanner(banner: JSONBanner): boolean {
            const now = new Date()

            if (Storage.isSupported && banner.tags) {
                const bannerTags = banner.tags ?? []
                const userTags: string[] = JSON.parse(Storage.get('tags') ?? '[]')
                const isMatch = bannerTags.every((tag) => userTags.includes(tag))
                if (!isMatch) return false
            }

            if (banner.start) {
                const startDate = new Date(banner.start)
                if (now < startDate) return false
            }

            if (banner.end) {
                const endDate = new Date(banner.end)
                if (now > endDate) return false
            }

            return true
        },

        onClick(banner: Banner) {
            window.open(banner.url, '_blank')
            Analytics.bannerClick(banner.url, 'connect')
        }
    }

})
</script>

<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

.slide-banner {
    user-select: none;
    max-width: 375px;
    margin: 18px auto 0;
    -webkit-mask-image: linear-gradient(to right, transparent 0%, white 10%, white 90%, transparent 100%);
    mask-image: linear-gradient(to right, transparent 0%, white 10%, white 90%, transparent 100%);
}

.slide {
    position: relative;
    display: block;
    padding: 0 6px;
    overflow: hidden;

    button {
        width: auto;
        margin: 0;
        padding: 0;
        border: none;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
    }

    img {
        width: 100%;
        height: auto;
        border-radius: 15px;
    }

    p {
        position: absolute;
        width: 100%;
        top: 1px;
        left: 0;
        color: white;
        font-size: 16px;
        text-align: center;
        overflow-x: hidden;
        white-space: nowrap;

        @media only screen and (max-width: 375px) {
            font-size: 12px;
        }
    }
}

:deep(.dots) {
    button {
        width: 6px;
        height: 6px;
        padding: 0;
        margin: 10px 5px 0;
        background-color: var(--inputPrimary);
        transition: transform 0.25s, background-color 0.25s;

        &.carousel__pagination-button--active {
            background-color: var(--accent);
            transform: scale(1.3);
        }
    }
}
</style>
