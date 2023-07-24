import {
    WSClient,
    GetRoomReply,
    ArtifactEntity,
    DoodleEntity,
    DropEntity,
    NumberEntity,
    ObjectEntity,
    TextEntity
} from '@jackboxgames/ecast'
import { getGame } from '@games/games'
import { log } from './Log'

/**
 * DebugRecorder is responsible for keeping track of debug states
 * as well as reporting them to ecast when requested.
 */

export class DebugRecorder {
    private client?: WSClient
    room?: GetRoomReply
    private items: Debug.Item[] = []
    private autoMarkWindow = 150 // milliseconds that will clump updates together
    private autoMarkTimeout?: number
    private autoMarkerCount = 0
    private automarkIgnoredKeys: string[] = []
    private automarkPendingLabel?: string

    get markerCount(): number {
        return this.items.reduce((acc: number, item) => {
            if ('marker' in item) return acc + 1
            return acc
        }, 0)
    }


    constructor(client: WSClient, room: GetRoomReply) {
        if (import.meta.env.TV_DEBUG) window.tv.debug = this.expose()

        this.client = client
        this.room = room

        // push initial values for each entity
        // and set a welcome marker
        Object.keys(this.client.entities).forEach((key) => {
            this.pushEntity(this.client!.entities[key] as Debug.SupportedEntity)
        })

        if (this.items.length) this.setMarker('welcome')

        client.on('artifact', (entity: ArtifactEntity) => this.pushEntity(entity))
        client.on('doodle', (entity: DoodleEntity) => this.pushEntity(entity))
        client.on('drop', (entity: DropEntity) => this.pushEntity(entity))
        client.on('number', (entity: NumberEntity) => this.pushEntity(entity))
        client.on('object', (entity: ObjectEntity) => this.pushEntity(entity))
        client.on('text', (entity: TextEntity) => this.pushEntity(entity))

        this.hijackConsole()
        this.hijackSend()
    }

    reset() {
        this.items = []
    }

    // keys passed to this function will not
    // automatically create an automarker
    setAutomarkIgnoredKeys(keys: string[]) {
        this.automarkIgnoredKeys = keys
    }

    // hijack console.error for capture
    private hijackConsole() {
        const nativeLog = console.error.bind(console)
        console.error = (...args) => {
            this.pushError(args)
            nativeLog.apply(console, args)
        }
    }

    // hijack WSClient.send for capture
    private hijackSend() {
        if (!window.Proxy) return

        // @ts-ignore
        this.client.send = new Proxy(this.client!.send, {
            apply: (target, context, args) => {
                this.pushSend(args)
                return target.apply(context, args)
            }
        })
    }


    // Items Push

    private pushEntity(entity: Debug.SupportedEntity) {
        log('[Debug] pushEntity', entity)


        if (entity instanceof ArtifactEntity) {
            this.items.push({
                type: 'artifact',
                ...entity
            })
        } else if (entity instanceof DoodleEntity) {
            this.items.push({
                type: 'doodle',
                ...entity
            })
        } else if (entity instanceof DropEntity) {
            this.items.push({
                key: entity.key,
                type: 'drop'
            })
        } else if (entity instanceof NumberEntity) {
            this.items.push({
                key: entity.key,
                type: 'number',
                value: entity.val,
                meta: entity.meta,
                restrictions: entity.restrictions
            })
        } else if (entity instanceof ObjectEntity) {
            if (entity.val.kind) {
                this.automarkPendingLabel = entity.val.kind
            }

            this.items.push({
                key: entity.key,
                type: 'object',
                value: entity.val,
                meta: entity.meta
            })
        } else if (entity instanceof TextEntity) {
            this.items.push({
                key: entity.key,
                type: 'text',
                value: entity.text,
                meta: entity.meta
            })
        }

        if (this.automarkIgnoredKeys.includes(entity.key)) {
            return
        }

        this.startAutoMarkTimeout()
    }

    private pushError(...args: any[]) {
        this.items.push({
            error: args
        })
    }

    private pushSend(args: any[]) {
        this.items.push({
            opcode: args[0],
            arguments: args[1]
        })
    }


    // Markers

    setMarker(label: string) {
        const sameNameCount = this.items.filter((item) => (item as Debug.MarkerItem).marker === label).length
        const marker = sameNameCount ? `label-${sameNameCount}` : label
        this.items.push({ marker })
        this.clearAutoMarkTimeout()
    }

    private setAutoMarker() {
        const label = this.automarkPendingLabel ?? 'marker'
        this.items.push({ marker: `${this.autoMarkerCount}-${label}` })
        this.autoMarkerCount += 1
        delete this.automarkPendingLabel
        this.clearAutoMarkTimeout()
    }

    private startAutoMarkTimeout() {
        this.clearAutoMarkTimeout()
        this.autoMarkTimeout = window.setTimeout(() => {
            this.setAutoMarker()
        }, this.autoMarkWindow)
    }

    private clearAutoMarkTimeout() {
        if (!this.autoMarkTimeout) return
        window.clearTimeout(this.autoMarkTimeout)
        delete this.autoMarkTimeout
    }


    // Send

    async send(message?: string) {
        if (!this.client) return

        const urls = await this.sendToEcast()
        if (urls && import.meta.env.TV_SLACK_DEBUG) {
            await this.sendToSlack(urls, message)
        }
    }

    private getSendData(): { appTag: string, state: Debug.Export.Version3 } {
        return {
            appTag: this.room!.appTag,
            state: {
                version: 3,
                room: {
                    code: this.room!.code,
                    appTag: this.room!.appTag
                },
                client: {
                    id: this.client!.id,
                    name: this.client!.name,
                    role: this.client!.role
                },
                items: this.items
            }
        }
    }

    async sendToEcast(): Promise<Record<string, string> | null> {
        const data = this.getSendData()

        try {
            const response = await fetch('https://ecast.jackboxgames.com/api/v2/controller/state', {
                method: 'POST',
                body: JSON.stringify(data)
            })

            const json = await response.json() as { body: { url: string }}

            if (!json.body || !json.body.url) {
                console.warn(json)
                return null
            }

            const splitURL = json.body.url.split('/')
            const file = splitURL[splitURL.length - 1].replace('.json', '')
            const game = splitURL[splitURL.length - 2]

            return {
                json: json.body.url,
                dev: `https://dev.jackbox.tv/debug/cloud/${game}/${file}/`,
                local: `http://localhost:9090/debug/cloud/${game}/${file}/`
            }
        } catch (error) {
            console.error('[Debug] sendToEcast', error)
            return null
        }
    }

    /* eslint-disable camelcase */
    private async sendToSlack(urls: Record<string, string>, message?: string) {
        if (!this.room) return
        if (!this.client) return

        const gameInfo = getGame(this.room.appTag)
        const entityCount = this.items.length - this.markerCount
        const markerText = `${this.markerCount} ${this.markerCount === 1 ? 'marker' : 'markers'}`
        const entityText = `${entityCount} ${entityCount === 1 ? 'entity' : 'entities'}`

        const contextBlocks = [
            {
                type: 'mrkdwn',
                text: `${this.client.role}:${this.client.id}`
            },
            {
                type: 'mrkdwn',
                text: `*Version:* ${window.tv.manifest.loader.version}`
            },
            {
                type: 'mrkdwn',
                text: `*Domain:* ${window.location.hostname}`
            }
        ]

        try {
            const url = import.meta.env.TV_SLACK_DEBUG
            if (!url) return

            const gameName = gameInfo?.name ?? this.room.appTag
            const title = `*${gameName} :${this.room.appTag}:* (${markerText}, ${entityText}) \n\n From: ${this.client.name},\n${message}`

            const blocks = [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: title
                    }
                },
                {
                    type: 'context',
                    elements: contextBlocks
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            action_id: 'actionId-0',
                            url: urls.json,
                            text: {
                                type: 'plain_text',
                                text: 'JSON',
                                emoji: true
                            }
                        },
                        {
                            type: 'button',
                            action_id: 'actionId-3',
                            url: urls.local,
                            text: {
                                type: 'plain_text',
                                text: 'localhost:9090',
                                emoji: true
                            }
                        },
                        {
                            type: 'button',
                            action_id: 'actionId-1',
                            url: urls.dev,
                            text: {
                                type: 'plain_text',
                                text: 'dev.jackbox.tv',
                                emoji: true
                            }
                        }
                    ]
                }
            ]

            const slackPayload: Debug.SlackPayload = {
                unfurl_links: false, // eslint-disable-line camelcase,
                blocks
            }

            if (this.room) {
                slackPayload.icon_emoji = this.room.appTag
                const gameInfo = getGame(this.room.appTag)
                slackPayload.username = `DebugRecorder ${(gameInfo) ? gameInfo.name : this.room.appTag}`
            }

            const doneResponse = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(slackPayload)
            })

            const doneText = await doneResponse.text()
            log('[Debug] sendToSlack', doneText)
        } catch (error) {
            console.error('[Debug] sendToSlack', error)
        }
    }
    /* eslint-enable camelcase */

    private download(filename?: string) {
        const file = filename ?? `${this.room?.appTag ?? 'unknown'}-debug`
        const data = this.getSendData().state
        const json = JSON.stringify(data, null, 4)
        const element = document.createElement('a')
        element.setAttribute('href', `data:text/json;charset=utf-8,${encodeURIComponent(json)}`)
        element.setAttribute('download', `${file}.json`)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }

    private open() {
        const data = this.getSendData().state
        const json = JSON.stringify(data, null, 4)
        const blank = window.open()
        blank!.document.write(`
            <iframe src="data:text/json;charset=utf-8,${encodeURIComponent(json)}" frameborder="0" style="border:0;
                top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen>
            </iframe>
        `)
        blank!.document.title = `${this.room?.appTag} debug JSON`
        blank!.document.close()
        blank!.focus()
    }


    // window.tv.debug

    private expose(): Debug.ExposedInterface {
        return {
            print: () => this.items,
            reset: () => this.reset(),
            setMarker: (label: string) => this.setMarker(label),
            download: (filename?: string) => this.download(filename),
            open: () => this.open(),
            send: (message?: string) => void this.send(message)
        }
    }
}

export namespace Debug {
    export type Type = 'cloud' | 'local'
    export type SupportedEntity = ArtifactEntity | DoodleEntity | DropEntity | NumberEntity | ObjectEntity | TextEntity
    export type MarkerMap = [number, MarkerItem][]
    export type MetaMap = [number, MetaItem][]
    export type MetaItem = MarkerItem | SendItem | ErrorItem
    export type EntityItem = ArtifactItem | DoodleItem | DropItem | NumberItem | ObjectItem | TextItem
    export type Item = MetaItem | EntityItem

    export interface MarkerItem {
        marker: string
    }

    export interface SendItem {
        opcode: string
        arguments: any[]
    }

    export interface ErrorItem {
        error: any[]
    }

    // eslint-disable camelcase
    export interface SlackPayload {
        unfurl_links: boolean,
        icon_emoji?: string,
        username?: string,
        blocks: Record<string, any>[]
    }
    // eslint-enable camelcase

    export interface ArtifactItem {
        type: 'artifact'
        key: string
        artifactId: string
        categoryId: string
        rootId: string
        meta?: WSClient.EntityMetadata
    }

    export interface DropItem {
        type: 'drop'
        key: string
    }

    export interface DoodleItem {
        type: 'doodle'
        key: string
        colors?: string[]
        lines: WSClient.DoodleLine[]
        live: boolean
        maxLayer?: number
        maxPoints?: number
        size?: WSClient.DoodleSize
        weights?: number[]
        meta?: WSClient.EntityMetadata
    }

    export interface NumberItem {
        type: 'number'
        key: string
        value: number
        meta?: WSClient.EntityMetadata
        restrictions?: WSClient.NumberRestrictions
    }

    export interface ObjectItem {
        type?: 'object'
        key: string
        value: Record<string, any>
        meta?: WSClient.EntityMetadata
    }

    export interface TextItem {
        type: 'text'
        key: string
        value: string
        meta?: WSClient.EntityMetadata
    }


    // Exports

    export namespace Export {
        export type Parsed = [Room, Client, MarkerMap, MetaMap, EntityItem[]]

        export interface JSON {
            version?: number
        }

        export interface Version1 extends JSON {
            version: 1 | undefined
            appId?: string
            appTag?: string
            states: Record<string, Record<string, any>>
        }

        export interface Version3 extends JSON {
            version: 3
            room: Room,
            client: Client,
            items: Item[]
        }

        export interface Room {
            appTag?: string
            code?: string
        }

        export interface Client {
            id?: number
            name?: string
            role?: WSClient.Role
        }
    }

    export interface ExposedInterface {
        [key: string]: (...args: any[]) => void
    }
}
