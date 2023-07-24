<template>
<form autocomplete="off" v-on:submit.prevent="onFormSubmit">
    <fieldset>
        <label for="roomcode">
            {{ $t('FORM.ROOM_CODE') }}
            <span v-if="state.statusKey" v-t="state.statusKey" class="status" />
            <span v-else-if="state.statusText" class="status">{{ state.statusText }}</span>
        </label>
        <TextInput
            id="roomcode"
            v-model="code"
            type="text"
            autocapitalize="off"
            autocorrect="off"
            autocomplete="off"
            :placeholder="$t('FORM.ROOM_CODE_PLACEHOLDER')"
            :maxlength="codeLength"
            v-on:input="onCodeInput"
        />

        <div v-if="room && warnings.length" class="warnings">
            <template v-for="warning in warnings">
                <p v-if="warning === 'flexbox'" :key="warning" v-bb="$t('WARNING.STYLE')" />
                <p v-if="warning === 'canvas'" :key="warning" v-bb="$t('ERROR.UNSUPPORTED_BROWSER')" />
                <p v-if="warning === 'camera'" :key="warning" v-bb="$t('WARNING.CAMERA')" />
            </template>
        </div>

        <label for="username">
            {{ $t('FORM.NAME') }}
            <span class="remaining">{{ nameLength - name.length }}</span>
        </label>
        <TextInput
            id="username"
            v-model="name"
            type="text"
            autocapitalize="off"
            autocorrect="off"
            autocomplete="off"
            :disabled="twitchUser !== undefined"
            :placeholder="$t('FORM.NAME_PLACEHOLDER')"
            :maxlength="nameLength"
            v-on:input="onNameInput"
        />

        <template v-if="shouldShowBranchOptions">
            <label for="branch">
                {{ $t('BRANCH.LABEL') }}
                <span v-if="selectedBranch" class="status date">{{ displayBranchLastUpdated }}</span>
            </label>
            <div class="select" :class="{ 'disabled': !room }">
                <select id="branch" v-model="branch" :class="{ 'no-selection': !selectedBranch }" :disabled="!room || isPreloading">
                    <option v-if="!room" value="" disabled>{{ $t('BRANCH.WAITING') }}</option>
                    <option v-else value="" disabled>{{ $t('BRANCH.SELECT') }}</option>
                    <option
                        v-for="(_, branchName) in branchOptions"
                        :key="branchName"
                        :value="branchName"
                    >
                        {{ branchName }}
                    </option>
                </select>
                <p v-if="selectedBranch" class="details">{{ displayBranchType }} {{ displayVersion }}</p>
            </div>
        </template>

        <button
            id="button-join"
            type="submit"
            :class="{ connecting: isConnecting, audience: state.joinAs === 'audience' }"
            :disabled="!state.canSubmit"
        >
            <span>{{ $t(state.submitKey) }}</span>
            <div class="loading" />
        </button>
    </fieldset>
    <p v-bb="$t('WARNING.TOS', { submit: $t(state.submitKey) })" class="tos" role="complementary" />
</form>
</template>


<script lang="ts">
import { Component, defineComponent } from 'vue'
import type { Match } from 'navigo'
import { v4 as UUID } from 'uuid'
import { APIClient } from '@jackboxgames/ecast'
import type { WSClient, GetRoomReply } from '@jackboxgames/ecast'
import {
    EcastRoomIsFull,
    EcastRoomIsLocked,
    EcastTwitchLoginRequired,
    EcastInvalidPassword,
    EcastFilterError,
    EcastRoomNotFound,
    EcastPasswordRequired,
    EcastPermissionDenied
} from '@jackboxgames/ecast/errors'
import type { TV } from '@tv/loader'
import {
    Analytics, FeatureDetector, Storage, Utils
} from '@tv/shared'
import type { Twitch } from '@tv/shared'
import { getGame } from '@games/games'
import { TextInput } from '@tv/vue'
import PasswordModal from './PasswordModal.vue'

interface ReconnectData {
    code: string
    id: number
    joinAs: WSClient.Role
    secret: string
    branch: string
}

interface State {
    canSubmit: boolean
    statusKey?: string
    statusText?: string
    submitKey: string
    joinAs?: WSClient.Role
}


export default defineComponent({
    components: {
        TextInput
    },

    props: {
        match: Object as Prop<Match>,
        twitchUser: Object as Prop<Twitch.User>
    },

    emits: {
        twitchLoginWasClicked: () => true
    },

    data() {
        return {
            codeLength: 4,
            code: '',
            nameLength: 12,
            name: '',
            passwordLength: 5,
            password: '',
            branch: '',
            isConnecting: false,
            reconnectData: <ReconnectData | null> null,
            api: new APIClient({
                host: Utils.serverUrl,
                scheme: 'https'
            }),
            isPreloading: false,
            preloaded: {
                appTag: <string | null> null,
                branch: <string | null> null
            },
            room: <GetRoomReply|null> null,
            roomNotFound: false,
            warnings: <FeatureDetector.Warning[]> []
        }
    },

    computed: {
        canConnect(): boolean {
            if (!this.hasFormData) return false
            if (this.isConnecting) return false
            if (this.isPreloading) return false
            if (!this.preloaded.appTag) return false
            return true
        },

        hasFormData(): boolean {
            if (this.code.length !== this.codeLength) return false
            if (!this.name) return false
            if (this.name.length > this.nameLength) return false
            return true
        },

        isReconnectable(): boolean {
            if (!this.reconnectData) return false
            if (this.code !== this.reconnectData.code) return false
            return true
        },

        state(): State {
            if (!this.room) {
                const showNotFound = this.code.length === this.codeLength && this.roomNotFound

                return {
                    canSubmit: false,
                    statusKey: showNotFound ? 'STATUS.ROOM_NOT_FOUND' : '',
                    submitKey: 'ACTION.PLAY'
                }
            }

            const gameName = getGame(this.room.appTag)?.name ?? '???'

            // Reconnect
            if (this.isReconnectable) {
                return {
                    canSubmit: this.canConnect,
                    statusKey: gameName,
                    submitKey: 'SUBMIT.RECONNECT',
                    joinAs: this.reconnectData!.joinAs
                }
            }

            // Game has started
            if (this.room.locked) {
                if (this.room.audienceEnabled) {
                    return {
                        canSubmit: this.canConnect,
                        statusKey: 'STATUS.GAME_STARTED',
                        submitKey: 'SUBMIT.JOIN_AUDIENCE',
                        joinAs: 'audience'
                    }
                }

                return {
                    canSubmit: false,
                    statusKey: 'STATUS.GAME_STARTED',
                    submitKey: 'SUBMIT.GAME_STARTED'
                }
            }

            // Game is full
            if (this.room.full) {
                if (this.room.audienceEnabled) {
                    return {
                        canSubmit: this.canConnect,
                        statusKey: 'STATUS.GAME_FULL',
                        submitKey: 'SUBMIT.JOIN_AUDIENCE',
                        joinAs: 'audience'
                    }
                }

                return {
                    canSubmit: false,
                    statusKey: 'STATUS.GAME_FULL',
                    submitKey: 'SUBMIT.GAME_FULL'
                }
            }

            return {
                canSubmit: this.canConnect,
                statusText: gameName,
                submitKey: 'ACTION.PLAY',
                joinAs: 'player'
            }
        },

        shouldShowBranchOptions(): boolean {
            return window.tv.manifest.environment !== 'production'
        },

        branchOptions(): Record<string, TV.Branch> {
            if (!this.room) return {}

            const branches: Record<string, TV.Branch> = {}

            Object.entries(window.tv.manifest.branches).forEach(([name, branch]) => {
                if (!branch.bundles[this.room!.appTag]) return
                branches[name] = branch
            })

            return branches
        },

        selectedBranch(): TV.Branch | undefined {
            return window.tv.manifest.branches[this.branch]
        },

        selectedBundle(): TV.BundleDefinition | undefined {
            if (!this.room) return
            return window.tv.manifest.branches[this.branch]?.bundles[this.room.appTag]
        },

        displayBranchLastUpdated(): string | undefined {
            if (!this.selectedBranch) return
            return new Date(this.selectedBranch.lastUpdated).toLocaleString()
        },

        displayBranchType(): string | undefined {
            if (!this.selectedBranch) return
            return this.selectedBranch.type === 'production' ? 'PROD' : 'DEV'
        },

        displayVersion(): string | undefined {
            return this.selectedBundle?.version ?? this.selectedBranch?.version
        }
    },

    watch: {
        twitchUser: 'twitchDidUpdate',
        branch: 'preloadBundle'
    },

    beforeMount() {
        this.populateFromStorage()
        void this.checkReconnect()
        this.populateFromURL()
    },

    methods: {

        // Initialization

        populateFromStorage() {
            if (!Storage.isSupported) return

            this.code = (Storage.get('code') ?? '').toUpperCase()
            this.name = (Storage.get('name') ?? '').toUpperCase()

            const reconnectToken = Storage.get('reconnect') ?? ''

            if (reconnectToken) {
                const [id, joinAs, secret, branch] = reconnectToken.split(':')
                this.reconnectData = {
                    code: this.code,
                    id: parseInt(id, 10),
                    joinAs: joinAs as WSClient.Role,
                    secret,
                    branch
                }
            }
        },

        populateFromURL() {
            const code = this.match?.params?.code
            const name = this.match?.params?.name
            const password = this.match?.params?.password

            if (code && code.length === this.codeLength) {
                this.code = code.toUpperCase()
                void this.getRoomInfo()
            }

            if (name) {
                this.name = name
            }

            if (password) {
                this.password = password
            }
        },

        async checkReconnect() {
            if (!this.code) return

            await this.getRoomInfo()

            if (!this.room) {
                this.code = ''
                Storage.remove('code')
                Storage.remove('reconnect')
            }
        },


        // Form

        onCodeInput() {
            // Room codes shouldn't have spaces, replace them all
            const regexSpace = /\s/g
            this.code = this.code
                .replace(regexSpace, '')
                .trim()
                .toUpperCase()

            if (this.code.length !== this.codeLength) {
                this.room = null
                return
            }

            void this.getRoomInfo()
        },

        onNameInput() {
            // Names can have internal spaces, but not leading ones
            const regexLeadingSpace = /^\s+/
            this.name = this.name.replace(regexLeadingSpace, '')
            const name = Utils.sanitizeName(this.name)
            this.name = name.toUpperCase()
        },

        async onFormSubmit() {
            await this.connect(this.state.joinAs)
        },

        getBranchForRoom(): string | null {
            if (!this.room) return null

            const tag = this.room.appTag
            const branches = window.tv.manifest.branches

            // cascading current branch
            const options = [
                this.branch, // the branch select
                this.match?.params?.branch, // query param
                this.room.controllerBranch, // sent from the game
                '** hmr **', // local files with hrm
                Storage.get('preference:branch'), // preferred branch setting
                '** dist **', // local dist files
                'main' // bundles.jackbox.tv/main
            ]

            for (let i = 0; i <= options.length; i++) {
                const option = options[i]
                if (!option) continue
                if (!branches[option]) continue
                if (!branches[option].bundles[tag]) continue
                return option
            }

            return null
        },


        // Password

        shouldPromptForPassword(joinAs: WSClient.Role): boolean {
            if (joinAs !== 'player') return false
            if (this.isReconnectable) return false
            if (!this.room!.passwordRequired) return false
            if (this.password) return false
            return true
        },

        async promptForPassword() {
            const result = await this.$showModal<string|boolean>(PasswordModal as Component, {
                room: this.room
            })

            if (!result) return

            if (result === true) {
                void this.connect('audience')
                return
            }

            this.password = result
            void this.connect('player')
        },


        // Twitch

        shouldPromptForTwitch(joinAs: WSClient.Role): boolean {
            if (joinAs !== 'player') return false
            if (!this.room!.twitchLocked) return false
            if (this.twitchUser) return false
            return true
        },

        async promptForTwitch() {
            const options = [
                {
                    text: this.$t('SUBMIT.TWITCH_LOGIN'),
                    classes: ['twitch'],
                    value: 'twitch'
                }
            ]

            if (this.room?.audienceEnabled) {
                options.push({
                    text: this.$t('SUBMIT.JOIN_AUDIENCE'),
                    classes: ['audience'],
                    value: 'audience'
                })
            } else {
                options.push({
                    text: this.$t('ACTION.CANCEL'),
                    classes: ['cancel'],
                    value: 'cancel'
                })
            }

            const selection = await this.$showModal('Options', {
                text: this.$t('ERROR.REQUIRES_TWITCH_LOGIN'),
                options
            })

            switch (selection) {
            case 'twitch':
                this.$emit('twitchLoginWasClicked')
                return
            case 'audience':
                void this.connect('audience')
            }
        },

        twitchDidUpdate(newValue: Twitch.User, oldValue?: Twitch.User) {
            // logging in
            if (newValue) {
                let name = newValue.display_name

                if (name.length > this.nameLength) {
                    name = `${name.slice(0, this.nameLength - 1)}…`
                }

                this.name = name
                return
            }

            // logging out
            if (oldValue && !newValue) {
                this.name = ''
            }
        },


        // Retry

        async promptForRetry(key: string) {
            let options = [
                {
                    text: this.$t('ACTION.OK'),
                    classes: ['cancel'],
                    value: 'close'
                }
            ]

            if (this.room?.audienceEnabled) {
                options = [
                    {
                        text: this.$t('FORM.PASSWORD_JOIN_AS_AUDIENCE'),
                        classes: ['audience'],
                        value: 'audience'
                    },
                    {
                        text: this.$t('ACTION.CANCEL'),
                        classes: ['cancel'],
                        value: 'close'
                    }
                ]
            }

            if (key === 'ERROR.AUDIENCE_IS_FULL') {
                options = [
                    {
                        text: this.$t('ACTION.OK'),
                        classes: ['ok'],
                        value: 'ok'
                    }
                ]
            }

            const selection = await this.$showModal('Options', {
                text: this.$t(key),
                options
            })

            if (selection === 'audience') {
                return this.connect('audience')
            }
        },


        // Room

        async getRoomInfo() {
            this.roomNotFound = false

            try {
                const room = await this.api.getRoom({ code: this.code })
                this.room = room
                this.warnings = await FeatureDetector.warningsForAppTag(room.appTag)

                // Convert any text to the locale of the room,
                // which may differ from the user's preference.
                // TODO: When this.room is cleared, reset locale to user's preferred
                this.$i18n.locale = this.room.locale

                const branch = this.getBranchForRoom()
                if (!branch) return
                this.branch = branch
                await this.preloadBundle()
            } catch (error) {
                console.warn(error)
                this.room = null
                this.roomNotFound = true
                this.branch = ''
            }
        },

        async preloadBundle() {
            if (!this.room) return
            if (!this.branch) return
            if (this.isPreloading) return

            const isNewApp = this.preloaded.appTag !== this.room.appTag
            const isNewBranch = this.preloaded.branch !== this.branch
            if (!isNewApp && !isNewBranch) return

            this.preloaded = {
                appTag: null,
                branch: null
            }

            try {
                this.isPreloading = true

                await window.tv.load({
                    app: this.room.appTag,
                    branch: this.branch
                })

                this.preloaded = {
                    appTag: this.room.appTag,
                    branch: this.branch
                }
            } catch (error) {
                console.error(error)
                this.showError('ERROR.UNABLE_TO_PRELOAD')
            }

            this.isPreloading = false
        },


        // Connect

        getConnectOptions(joinAs: WSClient.Role): WSClient.InitOptions {
            const host = joinAs === 'audience'
                ? this.room!.audienceHost
                : this.room!.host

            // name
            let sanitizedName = Utils.sanitizeName(this.name).trim()
            if (sanitizedName.length > this.nameLength) {
                sanitizedName = `${sanitizedName.substr(0, this.nameLength - 1)}…`
            }

            // user id
            let userId = UUID()
            if (Storage.isSupported) {
                userId = Storage.get('uuid') ?? userId
                Storage.set('uuid', userId)
            }

            // start building options
            const options: WSClient.InitOptions = {
                host,
                code: this.code.toUpperCase(),
                name: sanitizedName,
                password: this.password,
                role: joinAs,
                userId,
                debug: import.meta.env.TV_DEBUG
            }

            // twitch
            if (this.twitchUser) {
                options.twitchToken = this.twitchUser.token
            }

            // reconnect
            if (this.isReconnectable) {
                options.id = this.reconnectData!.id
                options.secret = this.reconnectData!.secret
            }

            return options
        },

        // eslint-disable-next-line complexity
        async connect(joinAs?: WSClient.Role) {
            if (!joinAs) return
            if (this.isConnecting) return
            if (!this.state.canSubmit) return

            await this.getRoomInfo()

            if (!this.room) {
                return this.showError('ERROR.ROOM_NOT_FOUND')
            }

            // if (isPreRelease(this.room.appId)) {
            //     return this.showPreReleaseModal()
            // }

            if (this.shouldPromptForPassword(joinAs)) {
                return this.promptForPassword()
            }

            if (this.shouldPromptForTwitch(joinAs)) {
                return this.promptForTwitch()
            }

            if (!window.tv.connect || !window.tv.mount) {
                return this.showError('ERROR.GENERIC')
            }

            const options = this.getConnectOptions(joinAs)
            if (!options.host) return
            if (!options.code) return
            if (!options.name) return

            if (this.isConnecting) return

            try {
                this.isConnecting = true

                const welcome = await window.tv.connect(options)

                if (Storage.isSupported) {
                    Storage.set('name', options.name)
                    Storage.set('code', this.code)
                    Storage.set('branch', this.branch)
                    Storage.set('reconnect', `${welcome.id}:${joinAs}:${welcome.secret}:${this.branch}`)
                }

                Analytics.setup() // Temp setup until analytics gets moved to window
                Analytics.gameJoined(this.room.appTag, {
                    role: joinAs,
                    locale: this.room.locale || 'en',
                    isQR: this.match?.params?.ref === 'qr',
                    isTwitchConnected: !!options.twitchToken,
                    isReconnect: welcome.reconnect
                })

                return window.tv.mount({
                    app: this.room.appTag,
                    branch: this.branch,
                    match: this.match,
                    room: this.room,
                    version: this.selectedBundle?.version ?? this.selectedBranch?.version,
                    welcome
                })
            } catch (error) {
                console.error('[connect]', error)
                this.isConnecting = false
                void this.onConnectionError(error as Error, joinAs)
            }
        },


        // Errors

        // eslint-disable-next-line complexity
        async onConnectionError(error: Error, role?: WSClient.Role) {
            if (error instanceof EcastRoomIsFull) {
                if (role === 'audience') {
                    return this.promptForRetry('ERROR.AUDIENCE_IS_FULL')
                }

                return this.promptForRetry('ERROR.ROOM_IS_FULL')
            }

            if (error instanceof EcastRoomIsLocked) {
                return this.promptForRetry('ERROR.ROOM_IS_LOCKED')
            }

            if (error instanceof EcastInvalidPassword) {
                await this.$showModal('Error', {
                    text: this.$t('ERROR.TITLE'),
                    subtext: this.$t('ERROR.INCORRECT_PASSWORD'),
                    dismissText: this.$t('ACTION.TRY_AGAIN')
                })

                this.password = ''
                return this.connect('player')
            }

            if (error instanceof EcastRoomNotFound) {
                return this.showError('ERROR.ROOM_NOT_FOUND')
            }

            if (error instanceof EcastTwitchLoginRequired) {
                return this.showError('ERROR.REQUIRES_TWITCH_LOGIN')
            }

            if (error instanceof EcastPasswordRequired) {
                return this.showError('FORM.PASSWORD_REQUIRED_TITLE')
            }

            if (error instanceof EcastFilterError) {
                return this.showError('ERROR.FILTER_NAME')
            }

            if (error instanceof EcastPermissionDenied) {
                return this.showError('ERROR.KICKED')
            }

            if (error.message?.includes('Network request failed')) {
                return this.showError('ERROR.UNABLE_TO_CONNECT')
            }

            this.showError('ERROR.GENERIC')
        },

        showError(subtextKey: string) {
            void this.$showModal('Error', {
                text: this.$t('ERROR.TITLE'),
                subtext: this.$t(subtextKey),
                dismissText: this.$t('ACTION.OK')
            })
        }
    }
})
</script>


<style lang="scss" scoped>
@use "@tv/shared/src/styles/jbg.scss" as jbg;

label {
    .status, .date {
        float: right;
        font-size: 14px;
        font-weight: normal;
        font-style: italic;
        color: var(--textSecondary);
    }

    .date {
        padding-top: 4px;
        font-size: 12px;
    }

    .remaining {
        float: right;
    }
}

.warnings {
    padding: 0 10px 15px;

    p {
        font-size: 11px;
        text-align: center;
    }
}

.select {
    select.no-selection {
        color: var(--textSecondary);
    }

    .details {
        position: absolute;
        top: 10px;
        right: 30px;
        color: var(--textPrimary);
        font-size: 14px;
        font-weight: normal;
    }
}

.tos {
    font-size: 12px;
    text-align: center;
    color: var(--textSecondary);

    &:deep(a) {
        color: var(--accent);
        text-decoration: none;
    }
}

// unscoped styles for the audience button
:global(button.audience::before) {
    content: '';
    display: inline-block;
    width: 40px;
    height: 23px;
    vertical-align: -6px;
    background-image: url("../images/icon-audience.svg");
    background-position: center left;
    background-repeat: no-repeat;
    opacity: 0.6;
}
:global(button.audience.connecting::before) {
    display: none;
}
</style>
