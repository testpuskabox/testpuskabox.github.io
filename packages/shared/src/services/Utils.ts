export class Utils {
    static queryParams = new URLSearchParams(window.location.search)
    static getQueryParam = (param: string) => this.queryParams.get(param)

    static get serverUrl(): string {
        const server = this.getQueryParam('server') ?? this.getQueryParam('s')
        if (!server) return import.meta.env.TV_ECAST

        // aliases
        if (server === 'live') return import.meta.env.TV_ECAST
        if (server === 'local') return 'https://localhost'
        if (server.includes('localhost')) return server

        return `${server}.jackboxgames.com`
    }

    static get isCanvasSupported(): boolean {
        const el = document.createElement('canvas')
        return !!(el.getContext && el.getContext('2d'))
    }

    static sleep = (milliseconds: number) => new Promise((resolve) => {
        window.setTimeout(resolve, milliseconds)
    })

    static toPrecision(n: number, p: number): number {
        const factorOfTen = 10 ** p
        return Math.round((n + Number.EPSILON) * factorOfTen) / factorOfTen
    }

    static isProduction() {
        return window.location.hostname === 'jackbox.tv'
    }

    // ////////////////////////////////////////
    // String Utils
    // ////////////////////////////////////////

    static htmlUnescape(s: string): string {
        return String(s)
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, '\'')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&amp;/gi, '&')
    }


    static htmlEscape(s: string): string {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
    }

    static sanitize(s: string): string {
        const string = this.sanitizeInput(s).replace(/'/g, '\u2019')
        return this.htmlEscape(string).trim()
    }

    /**
     * @deprecated please use Sanitize.username
     */
    static sanitizeName(s: string): string {
        // ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789¡ !"#$%&'()*+,-./¿
        // ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ…!?*$+\-'_.,
        return s
            .replace(/[^A-Z0-9\u00A1\u0020-\u002F\u00BF-\u00FF\u2026!?*$+\-'_ .,]/gi, '')
            .replace(/'/g, '\u2019')
    }

    /**
     * @deprecated please use Sanitize.input
     */
    static sanitizeInput(s: string): string {
        // change elipses characters to three dots instead
        s = s.replace('…', '...')
        return s.replace(/[^\u00A1\u0020-\u007E\u00BF-\u00FF’]/gi, '')
    }

    /**
     * @deprecated use Sanitize.emoji
     */
    static sanitizeEmoji(s: string): string {
        return s.replace(/(\u00a9|\u00ae|[\u2000-\u2017]|[\u2020-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/, '')
    }

    /**
     * Prevent user-submitted text from printing as valid HTML
     */
    static safeText(s: string): string {
        const temp = document.createElement('div')
        temp.textContent = s
        return temp.innerHTML
    }

    /**
     * Converts basic html tags into basic BBCode tags.
     * This function will not handle any tags that contain attributes.
     */
    static htmlTagsToBBCode(html: string, tagPairs: [string, string][]): string {
        if (!tagPairs.length) throw new Error('[Utils.htmlTagsToBBCode] No tag pairs were passed in')
        return tagPairs.reduce((value, pair) => {
            value.replaceAll(`<${pair[0]}>`, `[${pair[1]}]`)
            value.replaceAll(`</${pair[0]}>`, `</${pair[1]}>`)
            return value
        }, html)
    }

    // ////////////////////////////////////////
    // Color Utils
    // ////////////////////////////////////////

    static hexToRgb(hex: string): string {
        const arrBuff = new ArrayBuffer(4)
        const vw = new DataView(arrBuff)
        vw.setUint32(0, parseInt(hex.replace('#', ''), 16), false)
        const arrByte = new Uint8Array(arrBuff)

        return `${arrByte[1]},${arrByte[2]},${arrByte[3]}`
    }

    static adjustColor(hexValue: string, amount: number): string {
        let usePound = false
        let hex = hexValue

        if (hex[0] === '#') {
            hex = hex.slice(1)
            usePound = true
        }

        const num = parseInt(hex, 16)

        const r = Math.min(Math.max(0, (num >> 16) * amount), 255)
        const b = Math.min(Math.max(0, ((num >> 8) & 0x00FF) * amount), 255)
        const g = Math.min(Math.max(0, (num & 0x0000FF) * amount), 255)

        let s = (g | (b << 8) | (r << 16)).toString(16)

        while (s.length < hex.length) {
            s = `0${s}`
        }

        return (usePound ? '#' : '') + s
    }

    // ////////////////////////////////////////
    // Geometry Utils
    // ////////////////////////////////////////

    /**
     * Determines if two coordinates are within
     * or up to a certain tolerance.
     */
    static isInTolerance(pointA: Point, pointB: Point, tolerance: number): boolean {
        if (Math.abs(pointA.x - pointB.x) < tolerance) return false
        if (Math.abs(pointA.y - pointB.y) > tolerance) return false
        return true
    }

    /**
     * Calculates the distance between two points.
     */
    static getDistanceBetweenPoints(pointA: Point, pointB: Point): number {
        const cardinalDistances = [pointA.x - pointB.x, pointA.y - pointB.y]
        const distance = Math.hypot(...cardinalDistances)
        return Math.round(distance * 100) / 100
    }

    /**
     * Calculates the midpoint between two points
     */
    static getMidpoint(pointA: Point, pointB: Point): Point {
        return {
            x: (pointA.x + pointB.x) / 2,
            y: (pointA.y + pointB.y) / 2
        }
    }

    /**
     * Calculates the angle between points in degrees
     */
    static getAngleBetweenPoints(pointA: Point, pointB: Point): number {
        const arcTan = Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x)
        let angle = arcTan * (180 / Math.PI)
        if (angle < 0) angle += 360
        return 360 - angle
    }

    /**
     * Calculates the angular distance in degrees between two angles
     */
    static getAngularDistance(angleA: number, angleB: number): number {
        let angle = (angleB - angleA) % 360
        const sign = (angle < 0) ? 1 : -1
        angle = Math.abs(angle)
        return angle > 180
            ? sign * (360 - angle)
            : sign * angle
    }

    /**
     * Calculates the velocity of pixel/milliseconds between two points
     */
    static getVelocity(startPoint: Point, startTime: number, endPoint: Point, endTime: number): number {
        const distance = this.getDistanceBetweenPoints(startPoint, endPoint)
        return distance / (endTime - startTime)
    }

    /**
     * Determines if a point is within an element
     */
    static isInsideElement(point: Point, element: HTMLElement): boolean {
        const rect = element.getBoundingClientRect()
        if (point.x < rect.left) return false
        if (point.x > rect.left + rect.width) return false
        if (point.y < rect.top) return false
        if (point.y > rect.top + rect.height) return false
        return true
    }

    // ////////////////////////////////////////
    // Seeded Random Number Generation Utils
    // https://stackoverflow.com/a/47593316
    // ////////////////////////////////////////

    /**
     * Generates a hashed seed from arbitrary string input.
     */
    static cyrb128(str: string): [number, number, number, number] {
        let h1 = 1779033703; let h2 = 3144134277
        let h3 = 1013904242; let
            h4 = 2773480762
        for (let i = 0, k; i < str.length; i++) {
            k = str.charCodeAt(i)
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
        return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0]
    }

    /**
     * Creates a psuedorandom number generator from a 4-part seed of 32-bit
     * integers.
     */
    static sfc32(a: number, b: number, c: number, d: number) {
        return function rng() {
            a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0
            let t = (a + b) | 0
            a = b ^ (b >>> 9)
            b = c + (c << 3) | 0
            c = (c << 21) | (c >>> 11)
            d = d + 1 | 0
            t = t + d | 0
            c = c + t | 0
            return (t >>> 0) / 4294967296
        }
    }
}
