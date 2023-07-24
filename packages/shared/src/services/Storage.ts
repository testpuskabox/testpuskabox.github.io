import { Utils } from './Utils'

export class Storage {
    private static defaultNamespace = 'tv'

    /**
     * Returns if storage is supported. This not only means if the
     * client supports it but also if it have been disabled by the user
     * or via a query param
     */
    private static get namespace(): string {
        return window.tv.storage?.namespace ?? this.defaultNamespace
    }

    private static get isDisabled(): boolean {
        return window.tv.storage?.isDisabled ?? false
    }

    private static get tag(): string | undefined {
        return window.tv.storage?.tag
    }

    private static get code(): string | undefined {
        return window.tv.storage?.code
    }

    static get isSupported(): boolean {
        if (this.isDisabled) return false

        try {
            if (!window.localStorage) return false
            window.localStorage.setItem('support-check', '1')
            window.localStorage.removeItem('support-check')
            return true
        } catch (error) {
            return false
        }
    }


    /**
     * Sets up the global window.tv.storage object
     */
    static setup(tag?: string, code?: string) {
        delete window.tv.storage

        window.tv.storage = {
            namespace: Utils.getQueryParam('namespace') ?? Utils.getQueryParam('ns') ?? this.defaultNamespace,
            isDisabled: Utils.queryParams.has('incognito') || Utils.queryParams.has('nc')
        }

        if (tag) window.tv.storage.tag = tag

        if (code) {
            window.tv.storage.code = code.toLowerCase()
            this.clearCodeScopedKeys(window.tv.storage.code)
        }

        // TODO: delete this in July 2023
        this.migrateNamespace('blobcast', this.defaultNamespace)
    }


    // Public Interface

    /**
     * Gets the value for a key taking any current scope
     * in to account. If a scope is not provided we will
     * start with the narrowist scope and try each.
     */
    static get(key: string, scope?: Storage.Scope) {
        if (!this.isSupported) return null
        return window.localStorage.getItem(this.getScopedKey(key, scope))
    }

    /**
     * Sets or updates a key. If a scope is not provided
     * we will will default to none.
     */
    static set(key: string, value: string, scope: Storage.Scope = 'none') {
        if (!this.isSupported) return
        return window.localStorage.setItem(this.getScopedSetKey(key, scope), value)
    }

    /**
     * Removes the value for a key taking any current scope
     * in to account. If a scope is not provided we will
     * start with the narrowist scope and try each.
     */
    static remove(key: string, scope?: Storage.Scope) {
        if (!this.isSupported) return
        return window.localStorage.removeItem(this.getScopedKey(key, scope))
    }

    /**
     * Sets a new tag
     */
    static setTag(tag: string) {
        const key = tag.toLowerCase()
        const tagsString = this.get('tags') ?? '[]'
        const category = key.split('-')[0]
        let tags = JSON.parse(tagsString) as string[]

        // filter tags with the same category
        tags = tags.filter((t) => {
            const tagCategory = t.split('-')[0]
            return category !== tagCategory
        })

        tags.push(key)
        this.set('tags', JSON.stringify(tags))
    }


    // Scope Helpers

    // eslint-disable-next-line complexity
    private static getScopedKey(key: string, scope?: Storage.Scope): string {
        const noneKey = `${this.namespace}:${key}`
        const tagKey = this.tag ? `${this.namespace}:${key}:tag:${this.tag}` : null
        const codeKey = this.code ? `${this.namespace}:${key}:code:${this.code}` : null

        if (scope === 'none') {
            return noneKey
        }

        if (scope === 'tag') {
            if (!tagKey) throw new Error('[Storage] requested "tag" scope but tv.storage.tag is undefined')
            return tagKey
        }

        if (scope === 'code') {
            if (!codeKey) throw new Error('[Storage] requested "code" scope but tv.storage.code is undefined')
            return codeKey
        }

        // return the narrowest key with a value
        if (codeKey && window.localStorage.getItem(codeKey) !== null) return codeKey
        if (tagKey && window.localStorage.getItem(tagKey) !== null) return tagKey
        return noneKey
    }

    private static getScopedSetKey(key: string, scope: Storage.Scope = 'none'): string {
        if (scope === 'tag') {
            if (!this.tag) throw new Error('[Storage] requested "room" scope but tv.storage.tag is undefined')
            return `${this.namespace}:${key}:tag:${this.tag}`
        }

        if (scope === 'code') {
            if (!this.code) throw new Error('[Storage] requested "code" scope but tv.storage.code is undefined')
            return `${this.namespace}:${key}:code:${this.code}`
        }

        return `${this.namespace}:${key}`
    }


    // Maintenance

    // deletes all keys that do NOT match the passed code scope
    private static clearCodeScopedKeys(code: string) {
        if (!this.isSupported) return

        Object.keys(window.localStorage).forEach((key) => {
            const parts = key.split(':code:')
            if (parts.length <= 1) return
            if (parts[1] === code) return
            window.localStorage.removeItem(key)
        })
    }

    // TODO: delete this in July 2023
    // For migrating from blobcast to tv namespace.

    private static migrateNamespace(from: string, to: string) {
        if (!this.isSupported) return

        Object.keys(window.localStorage).forEach((key) => {
            if (!key.startsWith(`${from}-`)) return
            const newKey = key.replace(`${from}-`, `${to}:`)
            const item = window.localStorage.getItem(key)
            if (!item) return
            window.localStorage.setItem(newKey, item)
            window.localStorage.removeItem(key)
        })
    }
}

export namespace Storage {
    export type Scope = 'none' | 'tag' | 'code'
}
