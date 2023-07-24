import { v4 as UUID } from 'uuid'
import { Storage } from './Storage'

export class Twitch {
    user?: Twitch.User

    constructor(hash?: string) {
        if (!Storage.isSupported) {
            console.warn('Twitch Login requires local storage')
            return
        }

        this.processParams(hash)
    }

    prepare() {
        if (!Storage.isSupported) return null

        const token = Storage.get('token')
        if (!token) return null
        return this.fetchUser()
    }

    login() {
        if (!Storage.isSupported) return

        const twitchState = UUID()
        Storage.set('twitchState', twitchState)

        const clientId = import.meta.env.TV_TWITCH_CLIENT_ID
        let redirectURI = `https://${window.location.hostname}`

        if (window.location.hostname === 'localhost') {
            redirectURI = 'http://localhost:9090/'
        }

        let url = 'https://id.twitch.tv/oauth2/authorize'
        url += `?client_id=${clientId}`
        url += `&redirect_uri=${redirectURI}`
        url += '&response_type=token'
        url += '&scope=user:read:email'
        url += `&state=${twitchState}`

        window.location.href = url
    }

    logout() {
        if (!Storage.isSupported) return

        delete this.user
        Storage.remove('token')
    }

    processParams(hash?: string) {
        if (!hash) return
        if (!Storage.isSupported) return

        const expectedState = Storage.get('twitchState')
        if (!expectedState) {
            console.error('[Twitch] Could not find the expected state in local storage')
            return
        }

        const params = new URLSearchParams(hash)
        const token = params.get('access_token')
        const state = params.get('state')

        if (!token) {
            console.error('[Twitch] Invalid Twitch redirect hash')
            return
        }

        if (state !== expectedState) {
            console.error('[Twitch] State parameter doesn\'t match the expected state')
        }

        Storage.set('token', token)
        Storage.remove('twitchState')

        window.history.replaceState({}, document.title, '/')
    }

    async fetchUser() {
        if (!Storage.isSupported) return null

        const token = Storage.get('token')
        if (!token) throw new Error('[Twitch] Token not found in local storage')

        try {
            const response = await fetch('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Client-ID': import.meta.env.TV_TWITCH_CLIENT_ID
                }
            })

            const json = await response.json() as { data: Twitch.User[] }
            if (!json || !json.data) return null
            const user = json.data[0]
            user.token = token
            this.user = user
            return this.user
        } catch (err) {
            console.warn(err)
            return null
        }
    }
}

/* eslint-disable camelcase */
export namespace Twitch {
    export interface RedirectParams {
        access_token: string
        scope: string
        state: string
        token_type: string
    }

    export interface User {
        broadcaster_type: string
        created_at: string
        description: string
        display_name: string
        email: string
        id: string
        login: string
        offline_image_url: string
        profile_image_url: string
        token: string
        type: string
        view_count: number
    }
}
