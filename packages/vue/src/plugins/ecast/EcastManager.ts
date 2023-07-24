import { reactive, watch } from 'vue'
import cloneDeep from 'lodash/cloneDeep'
import debounce from 'lodash/debounce'
import set from 'lodash/set'
import {
    WSClient,
    ArtifactEntity,
    DoodleEntity,
    NumberEntity,
    ObjectEntity,
    TextEntity,
    TextMapEntity
} from '@jackboxgames/ecast'

/**
 * This class manages the shared APIClient and WSClient in a Vue-based game
 * session. Its main purpose is to maintain reactive values based on entities
 * inside its WSClient.
 */

export class EcastManager {
    wsClient?: WSClient
    private keyMap?: EcastManager.KeyMap
    private providerMap?: EcastManager.ProviderMap
    mappedValues: Record<string, EcastManager.SupportedValue> = reactive({}) // values, NOT entities
    shouldParseBlobcast = false

    // any keys set here will not update
    // but will catch up when resume is called
    private pausedKeys = <string[] | null> null

    // used by the sync chain
    private keyMapKeys?: string[]
    private providerMapKeys?: string[]
    private hotValues?: Record<string, EcastManager.SupportedValue>
    private newValues?: Record<string, EcastManager.SupportedValue>


    /**
     * Sets a connected WSClient on to this manager
     */
    setWSClient(wsClient: WSClient) {
        this.wsClient = wsClient
        this.setupWatcher()
    }

    setupWatcher() {
        this.wsClient!.entities = reactive(this.wsClient!.entities)
        watch(this.wsClient!.entities, (_staleValues, _hotValues) => {
            this.sync()
        })
    }


    /**
    * Will pause updates on the provided keys. If no keys
    * are passed all ecast uopdates will be paused
    */

    pause = (keys: string[] = []) => {
        this.pausedKeys = keys
    }

    resume = () => {
        this.pausedKeys = null
        this.sync()
    }


    /**
    * Called everytime WSClient receives any type of notification
    * and syncs mappedValues up with wsClient.entities
    */
    sync = debounce(() => {
        if (!this.wsClient) return
        if (!this.keyMap && !this.providerMap) return
        if (this.pausedKeys && !this.pausedKeys.length) return

        // execute sync chain

        this.hotValues = {}
        this.newValues = {}

        this.normalize()
            .mapKeysToValues()
            .mapProvidersToValues()
            .deleteDropped()
            .hydrateRefs()
            .syncExisting()

        delete this.hotValues
        delete this.newValues
    }, 50)

    /**
     * Returns the relevant value from an entity based on its
     * constructor. Also acts as a filter for what entities we
     * currently support in game data by returning null otherwise
     */
    private valueForEntity(entity: unknown): any {
        if (
            entity instanceof ArtifactEntity
            || entity instanceof DoodleEntity
            || entity instanceof TextMapEntity
            || entity instanceof NumberEntity
        ) {
            return entity
        }

        if (entity instanceof ObjectEntity) {
            // Return a deep copy to avoid overwriting refs in wsClient.entities
            return cloneDeep(entity.val)
        }

        if (entity instanceof TextEntity) {
            return entity.text
        }

        return null
    }


    // Sync Chain

    /**
     * Normalizes entities into an object of key/values by:
     * - picking off the relevant value of the entity (.val, .text, etc)
     * - optionally parsing away the legacy blobcast protocol
     * - filtering out "unsupported entities" (see valueForEntity())
     */
    private normalize() {
        const wsKeys = Object.keys(this.wsClient!.entities)

        for (let i = 0; i < wsKeys.length; i++) {
            let wsKey = wsKeys[i]
            if (this.pausedKeys?.includes(wsKey)) continue

            const value = this.valueForEntity(this.wsClient!.entities[wsKey])

            if (value === null || value === undefined) continue

            if (this.shouldParseBlobcast) {
                const splitKey = wsKey.split(':')

                if (splitKey[0] === 'bc') {
                    if (splitKey[1] === 'customer') {
                        if (splitKey[2] !== `${this.wsClient!.id}`) continue
                        wsKey = 'player'
                    } else if (splitKey[1] === 'room') {
                        wsKey = 'room'
                    }
                }
            }

            this.hotValues![wsKey] = value
        }

        return this
    }

    /**
     * Converts properties with a ref to the ref'd value
     */
    private hydrateRefs() {
        const hydrate = (obj: Record<string, any>, path: string, deep = false) => {
            // support both $ref and ref
            const ref = obj.$ref ?? obj.ref

            if (ref) {
                const refEntity = this.hotValues![ref]

                if (refEntity === undefined) {
                    throw new Error(`[ecastPlugin] entity "${path}" referenced entity "${ref}" but it does not exist`)
                }

                set(this.newValues!, path, refEntity)
            } else if (deep) {
                Object.entries(obj).forEach(([key, val]) => {
                    // keep looking within objects or arrays
                    if (val !== null && typeof val === 'object') {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        hydrate(val, `${path}.${key}`, deep)
                    }
                })
            }
        }

        Object.entries(this.newValues!).forEach(([mappedKey, mappedValue]) => {
            if (!mappedValue) return

            Object.entries(mappedValue).forEach(([fieldKey, fieldValue]) => {
                // only look for refs within objects or arrays
                if (fieldValue !== null && typeof fieldValue === 'object') {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    hydrate(fieldValue, `${mappedKey}.${fieldKey}`, this.keyHasDeepRefs(mappedKey))
                }
            })
        })

        return this
    }

    /**
     * Returns if a key is expected to support deep refs
     */
    private keyHasDeepRefs(key: string) {
        if (this.keyMap?.[key]?.hasDeepRefs) return true
        if (this.providerMap?.[key]?.hasDeepRefs) return true
        return false
    }

    /**
     * Maps values to the correct keys based on the current keyMap
     */
    private mapKeysToValues() {
        if (!this.keyMap) return this

        for (let i = 0; i < this.keyMapKeys!.length; i++) {
            this.newValues![this.keyMapKeys![i]] = this.hotValues![this.keyMap[this.keyMapKeys![i]].key]
        }

        return this
    }

    /**
     * Executes provider functions and sets the value based on current providerMap
     */
    private mapProvidersToValues() {
        if (!this.providerMap) return this

        for (let i = 0; i < this.providerMapKeys!.length; i++) {
            this.newValues![this.providerMapKeys![i]] = this.providerMap[this.providerMapKeys![i]].fn(this.hotValues!, this.wsClient!)
        }

        return this
    }

    /**
     * Deletes dropped keys from mapped values
     */
    private deleteDropped() {
        const mappedValuesKeys = Object.keys(this.mappedValues)

        for (let i = 0; i < mappedValuesKeys.length; i++) {
            if (!this.newValues![mappedValuesKeys[i]]) {
                delete this.mappedValues[mappedValuesKeys[i]]
            }
        }

        return this
    }

    /**
     * Sync existing keys and set new keys on mapped values
     */
    private syncExisting() {
        const newValuesKeys = Object.keys(this.newValues!)

        for (let i = 0; i < newValuesKeys.length; i++) {
            this.mappedValues[newValuesKeys[i]] = this.newValues![newValuesKeys[i]]
        }

        return this.mappedValues
    }


    // Mappings

    /**
     * Adds mapping of keys to this manager
     */
    addKeys(keys: Record<string, string|EcastManager.KeyMapFn | EcastManager.KeyMapObject>) {
        if (!this.keyMap) this.keyMap = {}

        Object.keys(keys).forEach((key) => {
            if (typeof keys[key] === 'function') {
                const fn = keys[key] as EcastManager.KeyMapFn
                this.keyMap![key] = {
                    key: fn(this.wsClient!),
                    hasDeepRefs: false
                }

                return
            }

            if (typeof keys[key] === 'object') {
                const obj = keys[key] as EcastManager.KeyMapObject
                this.keyMap![key] = {
                    key: obj.fn ? obj.fn(this.wsClient!) : obj.key!,
                    hasDeepRefs: obj.hasDeepRefs ?? false
                }

                return
            }

            this.keyMap![key] = { key: keys[key] as string }
        })

        this.keyMapKeys = Object.keys(this.keyMap)
        this.sync()
    }

    /**
     * Purge keys from this managers keyMap
     */
    purgeKeys(keys: Record<string, string | EcastManager.KeyMapFn | EcastManager.KeyMapObject>) {
        if (!this.keyMap) return

        Object.keys(keys).forEach((key) => {
            if (this.keyMap![key]) delete this.keyMap![key]
        })

        this.keyMapKeys = Object.keys(this.keyMap)
        this.sync()
    }

    /**
     * Adds mapping of providers to this manager
     */
    addProviders(providers: Record<string, EcastManager.ProviderMapFn | EcastManager.ProviderMapObject>) {
        if (!this.providerMap) this.providerMap = {}

        Object.keys(providers).forEach((key) => {
            if (typeof providers[key] === 'object') {
                const obj = providers[key] as EcastManager.ProviderMapObject
                this.providerMap![key] = {
                    fn: obj.fn,
                    hasDeepRefs: obj.hasDeepRefs ?? false
                }

                return
            }

            this.providerMap![key] = { fn: providers[key] as EcastManager.ProviderMapFn }
        })

        this.providerMapKeys = Object.keys(this.providerMap)
        this.sync()
    }

    /**
     * Purge providers from this managers providerMap
     */
    purgeProviders(providers: Record<string, EcastManager.ProviderMapFn | EcastManager.ProviderMapObject>) {
        if (!this.providerMap) return

        Object.keys(providers).forEach((key) => {
            if (this.providerMap![key]) delete this.providerMap![key]
        })

        this.providerMapKeys = Object.keys(this.providerMap)
        this.sync()
    }
}

export namespace EcastManager {
    export type SupportedValue = Record<string, any> | string
    export type KeyMapFn = (wsClient: WSClient) => string
    export type KeyMap = Record<string, { key: string, hasDeepRefs?: boolean }>
    export type ProviderMapFn = (values: Record<string, any>, wsClient: WSClient) => SupportedValue
    export type ProviderMap = Record<string, { fn: ProviderMapFn, hasDeepRefs?: boolean }>

    export interface KeyMapObject {
        hasDeepRefs?: boolean
        key?: string
        fn?: KeyMapFn
    }

    export interface ProviderMapObject {
        hasDeepRefs?: boolean
        fn: ProviderMapFn
    }
}
