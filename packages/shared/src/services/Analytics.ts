/* eslint-disable camelcase */
import type { WSClient } from '@jackboxgames/ecast'
import mixpanel from 'mixpanel-browser'

/**
 * Analytics is a collection of static methods mapping to Google Analytics 4.
 * When adding a new event check if there is a "recommended event" available
 * to map to. But only do this if it is a clean mapping. ie: don't map clicking
 * a gallery image to "generate_lead".
 * https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 *
 * If a recommended event doesn't exist, create a custom event in the GA4 dashboard.
 * Note you have to add it to both the production and development data streams.
 * Jackbox.tv > Configure > Events > Create Event
 *
 * Use snake_case when possible to match the GA4 convention.
 *
 * Be vigilent in typing this file! Only YOU can keep our new analytics property sane.
 */

export class Analytics {
    /**
     * setup analytics should only be called once by loader
     */
    static setup() {
        gtag('config', import.meta.env.TV_GA_MEASUREMENT_ID, {
            send_page_view: false
        })

        mixpanel.init(import.meta.env.TV_MIXPANEL_TOKEN, {
            debug: import.meta.env.TV_DEBUG
        })
    }

    /**
     * "virtual page views" are tracked manually when bundles are mounted
     */
    static pageView(tag: string) {
        gtag('event', 'page_view', {
            page_title: tag,
            page_location: `https://jackbox.tv/${tag}`
        })
    }

    /**
     * tracks when a game is started by a vip and certain properties if they
     * are relevent to that game
     */
    static gameStarted(tag: string, options: Analytics.GameStartedOptions) {
        const eventData: Record<string, any> = { tag }
        if (options.isUGC !== undefined) eventData.is_ugc = options.isUGC
        if (options.isSequel !== undefined) eventData.is_sequel = options.isSequel
        if (options.locale !== undefined) eventData.locale = options.locale
        if (options.mode !== undefined) eventData.mode = options.mode
        if (options.numberOfPlayer !== undefined) eventData.number_of_players = options.numberOfPlayer

        gtag('event', 'game_start', eventData)
    }

    /**
     * tracks when a game is joined certain properties about that connection
     */
    static gameJoined(tag: string, options: Analytics.GameJoinedOptions) {
        mixpanel.track('Game Joined', { tag, ...options })
    }

    /**
     * tracks when a banner link is clicked either on the signin screen
     * or in a post game
     */
    static bannerClick(url: string, location: Analytics.BannerClickLocation) {
        gtag('event', 'banner_click', { url, location })
    }

    /**
     * tracks any click on a link that goes external to jackbox with the exception
     * of galleries and banners
     */
    static externalLinkClick(url: string, location: Analytics.ExternalLinkClickLocation) {
        gtag('event', 'external_link_click', { url, location })
    }

    /**
     * tracks when a gallery link is clicked and where that link was located.
     */
    static galleryClick(categoryId: string, location: Analytics.GalleryClickLocation) {
        gtag('event', 'gallery_click', {
            category_id: categoryId,
            location
        })
    }

    /**
     * tracks when a gallery link is shown and where that link was located.
     */
    static galleryImpression(categoryId: string, location: Analytics.GalleryClickLocation) {
        gtag('event', 'gallery_impression', {
            category_id: categoryId,
            location
        })
    }


    /**
     * tracks when a moderator connects to a game.
     */
    static moderatorConnected(tag: string) {
        gtag('event', 'moderator_connected', { tag })
    }

    /**
     * tracks when a moderator connects to a game.
     */
    static itemModerated(tag: string, wasRejected: boolean) {
        gtag('event', 'item_moderated', {
            tag,
            was_rejected: wasRejected
        })
    }

    /**
     * tracks when a moderator kicks a player.
     */
    static playerKicked(tag: string, isLobby: boolean) {
        gtag('event', 'player_kicked', {
            tag,
            is_lobby: isLobby
        })
    }
}

export namespace Analytics {
    export type BannerClickLocation = 'connect' | 'post_game'
    export type ExternalLinkClickLocation = 'hamburger'
    export type GalleryClickLocation = 'recent_game' | 'past_game' | 'post_game'

    export interface GameStartedOptions {
        isUGC?: boolean
        isSequel?: boolean
        locale?: string
        mode?: string
        numberOfPlayer?: number
    }

    export interface GameJoinedOptions {
        role: WSClient.Role
        locale: string
        isQR: boolean
        isTwitchConnected: boolean
        isReconnect: boolean
    }
}
