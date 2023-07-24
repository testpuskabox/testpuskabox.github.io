import { Utils } from './Utils'

export class PointerBox {
    static isPolyfilled = false

    private activePointers: Map<number, PointerBox.Pointer> = new Map()
    private element: HTMLElement
    private documentElement: HTMLElement
    private usePointerEvents: boolean
    private isCanceled = false
    private cachedElementRect?: DOMRect
    private cachedDocumentRect?: DOMRect
    private cachedTranslations?: PointerBox.Translation[]

    // HACK: Windows users with a Wacom tablet on Firefox with Windows Ink
    // disabled need to have the pointer persisted.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1583480
    // private capturedPointer?: PointerBox.CapturedPointer

    // Options
    private isMultitouch: boolean // option to track multiple pointers
    private isRestrictedToBox?: boolean // option to not track pointers if they leave the element
    private swipeVelocity: number // speed you must be moving for a swipe
    private swipeDistance: number // tolerance that must move for a swipe

    // TODO: Implement "pause on leave" option that stops a captured pointer
    // from firing move events when it leaves the box, but resumes if the
    // pointer enters again without losing capture. Perhaps generate
    // pointerboxpause and pointerboxresume events at those precise moments?
    //
    // private shouldPauseOnLeave?: boolean


    constructor(element: HTMLElement, options: PointerBox.ConstructorOptions) {
        this.applyPolyfill()
        this.element = element
        this.documentElement = document.documentElement
        this.usePointerEvents = window.PointerEvent !== undefined

        this.isRestrictedToBox = options.restrictToBox
        this.isMultitouch = options.isMultitouch ?? false
        this.swipeDistance = options.swipeDistance ?? 30
        this.swipeVelocity = options.swipeVelocity ?? 0.5
        this.bindStaticEvents()
    }

    destroy() {
        this.unbindStaticEvents()
        this.unbindStartedEvents()
    }

    cancel() {
        this.isCanceled = true
        this.unbindStartedEvents()
    }


    // Helpers

    private isPointerEvent(event: Event): event is PointerEvent {
        if (window.PointerEvent === undefined) return false
        return event instanceof PointerEvent
    }

    private isTouchEvent(event: Event): event is TouchEvent {
        if (!('ontouchstart' in window)) return false
        return event instanceof TouchEvent
    }

    private isMouseEvent(event: Event): event is MouseEvent {
        return event instanceof MouseEvent
    }

    private getTouchById(touchList: TouchList, id: number): Touch | void {
        return Array.from(touchList).find((touch) => touch.identifier === id)
    }


    // Bind/Unbind Events

    // Static events are bound immediately in the constructor
    // and remain bound unless the class is destroyed
    private bindStaticEvents() {
        this.element.addEventListener('click', this.boundOnClick)

        if (this.usePointerEvents) {
            this.element.addEventListener('pointerdown', this.boundOnStart)
            return
        }

        this.element.addEventListener('touchstart', this.boundOnStart)
        this.element.addEventListener('mousedown', this.boundOnStart)
    }

    private unbindStaticEvents() {
        this.element.removeEventListener('click', this.boundOnClick)

        if (this.usePointerEvents) {
            this.element.removeEventListener('pointerdown', this.boundOnStart)
            return
        }

        this.element.removeEventListener('touchstart', this.boundOnStart)
        this.element.removeEventListener('mousedown', this.boundOnStart)
    }

    // All other events are bound only when a start event is
    // triggered and they are unbound within the end event
    private bindStartedEvents() {
        if (this.usePointerEvents) {
            this.element.addEventListener('pointermove', this.boundOnMove)
            this.element.addEventListener('pointerup', this.boundOnEnd)

            if (this.isRestrictedToBox) {
                this.element.addEventListener('pointerleave', this.boundOnEnd)
            }

            // HACK: iOS Safari aggressively releases pointer capture when
            // leaving the box, even when isRestrictedToBox is false. Treat this
            // as an end event so consumers can clean up.
            this.element.addEventListener('lostpointercapture', this.boundOnEnd)

            this.disableChildPointerEvents()
            return
        }

        this.element.addEventListener('touchmove', this.boundOnMove)
        this.element.addEventListener('mousemove', this.boundOnMove)
        this.element.addEventListener('touchend', this.boundOnEnd)
        this.element.addEventListener('mouseleave', this.boundOnEnd)
        this.element.addEventListener('mouseup', this.boundOnEnd)
    }

    private unbindStartedEvents() {
        if (this.usePointerEvents) {
            this.element.removeEventListener('pointermove', this.boundOnMove)
            this.element.removeEventListener('pointerup', this.boundOnEnd)

            if (this.isRestrictedToBox) {
                this.element.removeEventListener('pointerleave', this.boundOnEnd)
            }

            this.element.removeEventListener('lostpointercapture', this.boundOnEnd)

            this.enableChildPointerEvents()
            return
        }

        this.element.removeEventListener('touchmove', this.boundOnMove)
        this.element.removeEventListener('mousemove', this.boundOnMove)
        this.element.removeEventListener('touchend', this.boundOnEnd)
        this.element.removeEventListener('mouseleave', this.boundOnEnd)
        this.element.removeEventListener('mouseup', this.boundOnEnd)
    }


    // Handlers

    private boundOnClick = this.onClick.bind(this)
    private boundOnStart = this.onStart.bind(this)
    private boundOnMove = this.onMove.bind(this)
    private boundOnEnd = this.onEnd.bind(this)

    private onClick(event: Event) {
        const detail = this.getStartDetail(event, { id: 0, type: 'click' })
        const clickEvent = new CustomEvent<PointerBox.StartDetail>('pointerbox:click', { detail })
        this.element.dispatchEvent(clickEvent)
    }

    private onStart(event: Event) {
        event.preventDefault()
        this.isCanceled = false

        // If this isn't multitouch and we already have an
        // active pointer we can ignore this start event.
        // Note: this prevents it from being added as an
        // active pointer so it is ignored in the future.
        if (!this.isMultitouch && this.activePointers.size) {
            return false
        }

        // PointerEvent
        if (this.isPointerEvent(event)) {
            this.processStartEvent(event, {
                id: event.pointerId,
                type: event.pointerType
            })

            return false
        }

        // TouchEvent: loop over targetTouches and
        // process any new identifiers as start events
        if (this.isTouchEvent(event)) {
            for (let i = 0; i < event.targetTouches.length; i++) {
                const touch = event.targetTouches.item(i)!

                this.processStartEvent(event, {
                    id: touch.identifier,
                    type: 'touch'
                }, touch)
            }

            return false
        }

        // MouseEvent
        this.processStartEvent(event, {
            id: 0,
            type: 'mouse'
        })

        return false
    }

    private processStartEvent(event: Event, pointerInfo: PointerBox.PointerInfo, touch?: Touch) {
        if (this.activePointers.get(pointerInfo.id)) {
            return
        }

        // TODO: deal with the wacom bug
        // if (this.isPointerEvent(event))
        //     this.capturedPointer = {
        //         id: pointerEvent.pointerId,
        //         type: pointerEvent.pointerType
        //     }

        //     if (!this.isRestrictedToBox) {
        //         this.element.setPointerCapture(this.capturedPointer.id)
        //     }
        // }

        const detail = this.getStartDetail(event, pointerInfo, touch)

        // create a new active pointer
        const pointer: PointerBox.Pointer = {
            id: pointerInfo.id,
            type: pointerInfo.type,
            distanceAccumulator: 0,
            velocityValues: [0],
            children: document.elementsFromPoint(detail.clientX, detail.clientY),
            previousEventTimestamp: Date.now(),
            initial: detail,
            previous: detail as PointerBox.MoveDetail
        }

        this.activePointers.set(pointerInfo.id, pointer)

        const StaticEvent = new CustomEvent<PointerBox.StartDetail>('pointerbox:start', { detail })
        this.element.dispatchEvent(StaticEvent)

        // child events
        const childDownEvent = new CustomEvent<PointerBox.StartDetail>('pointerbox:childdown', { detail })
        pointer.children.forEach((element) => element.dispatchEvent(childDownEvent))

        this.bindStartedEvents()
    }

    private onMove(event: Event) {
        event.preventDefault()
        if (this.isCanceled) return

        // PointerEvent
        if (this.isPointerEvent(event)) {
            this.processMoveEvent(event, {
                id: event.pointerId,
                type: event.pointerType
            })

            return false
        }

        // TouchEvent: loop over changedTouches and
        // process any known pointers as move events
        if (this.isTouchEvent(event)) {
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.targetTouches.item(i)!

                this.processMoveEvent(event, {
                    id: touch.identifier,
                    type: 'touch'
                }, touch)
            }

            return false
        }

        // MouseEvent
        this.processMoveEvent(event, {
            id: 0,
            type: 'mouse'
        })

        return false
    }

    private processMoveEvent(event: Event, pointerInfo: PointerBox.PointerInfo, touch?: Touch) {
        const pointer = this.activePointers.get(pointerInfo.id)

        if (!pointer) {
            return false
        }

        // TODO: deal with the wacom bug
        // if (this.isPointerEvent(event)) {
        //     if (!event.isPrimary && !this.isMultitouch) {
        //         return
        //     }

        //     if (pointerEvent.pointerType !== this.capturedPointer?.type) {
        //         return
        //     }
        // }

        const detail = this.getMoveDetail(event, pointer, touch)
        pointer.previous = detail
        pointer.previousEventTimestamp = Date.now()

        const moveEvent = new CustomEvent<PointerBox.MoveDetail>('pointerbox:move', { detail })
        this.element.dispatchEvent(moveEvent)

        return false
    }

    private onEnd(event: Event) {
        event.preventDefault()
        if (this.isCanceled) return

        // PointerEvent
        if (this.isPointerEvent(event)) {
            this.processEndEvent(event, {
                id: event.pointerId,
                type: event.pointerType
            })

            return false
        }

        // TouchEvent: loop over activePointers and process any
        // that no longer exist in event.touches as end events
        if (this.isTouchEvent(event)) {
            this.activePointers.forEach((pointer, id) => {
                if (this.getTouchById(event.touches, id)) return

                // this touchend event will not have a touch for this pointer
                // so we grab it from the originalEvent on pointer.previous
                const previousTouch = this.getTouchById((pointer.previous!.originalEvent as TouchEvent).touches, id)
                if (!previousTouch) throw new Error('[PointerBox] No previous details stored')

                this.processEndEvent(event, {
                    id,
                    type: pointer.type
                }, previousTouch)
            })

            return false
        }


        // MouseEvent
        this.processEndEvent(event, {
            id: 0,
            type: 'mouse'
        })

        return false
    }

    private processEndEvent(event: Event, pointerInfo: PointerBox.PointerInfo, touch?: Touch) {
        const pointer = this.activePointers.get(pointerInfo.id)

        if (!pointer) {
            return false
        }

        // TODO: deal with the wacom bug
        // if (this.isPointerEvent(event)) {
        //     if (pointerEvent.pointerType !== this.capturedPointer?.type) {
        //         return
        //     }

        //     if (this.element.hasPointerCapture(this.capturedPointer.id)) {
        //         this.element.releasePointerCapture(this.capturedPointer.id)
        //     }

        //     delete this.capturedPointer
        // }

        const detail = this.getMoveDetail(event, pointer, touch)
        const endEvent = new CustomEvent<PointerBox.MoveDetail>('pointerbox:end', { detail })
        this.element.dispatchEvent(endEvent)

        this.checkForSwipe(endEvent)

        this.activePointers.delete(pointer.id)

        if (!this.activePointers.size) {
            delete this.cachedElementRect
            delete this.cachedDocumentRect
            delete this.cachedTranslations
            this.unbindStartedEvents()
        }

        // child events
        const childUpEvent = new CustomEvent<PointerBox.StartDetail>('pointerbox:childup', { detail })
        const children = document.elementsFromPoint(detail.clientX, detail.clientY)
        children.forEach((element) => {
            element.dispatchEvent(childUpEvent)

            if (!pointer.children.includes(element)) return
            const childClickEvent = new CustomEvent<PointerBox.StartDetail>('pointerbox:childclick', { detail })
            element.dispatchEvent(childClickEvent)
        })

        return false
    }


    // Gestures

    private checkForSwipe(event: PointerBox.MoveEvent) {
        const detail = event.detail as PointerBox.SwipeDetail

        if (detail.distanceFromInitial < this.swipeDistance) return
        if (detail.previous.normalizedVelocity < this.swipeVelocity) return

        const degrees = detail.degreesFromInitial
        if (degrees > 45 && degrees < 135) detail.direction = 'up'
        else if (degrees > 135 && degrees < 225) detail.direction = 'left'
        else if (degrees > 225 && degrees < 315) detail.direction = 'down'
        else detail.direction = 'right'

        const swipeEvent = new CustomEvent<PointerBox.SwipeDetail>('pointerbox:swipe', { detail })
        const swipeDirectionEvent = new CustomEvent<PointerBox.SwipeDetail>(`pointerbox:swipe${detail.direction}`, { detail })
        this.element.dispatchEvent(swipeEvent)
        this.element.dispatchEvent(swipeDirectionEvent)
    }


    // Normalize Event

    private getStartDetail(event: Event, pointerInfo: PointerBox.PointerInfo, touch?: Touch): PointerBox.StartDetail {
        let pageX: number
        let pageY: number
        let clientX: number
        let clientY: number

        if (!this.cachedElementRect) {
            this.cachedElementRect = this.element.getBoundingClientRect()
        }

        // Allows us to account for instances where the document is
        // offset from the top of the screen. ie: iOS 15
        if (!this.cachedDocumentRect) {
            this.cachedDocumentRect = this.documentElement.getBoundingClientRect()
        }

        const topOffset = this.cachedDocumentRect.top

        if (!this.cachedTranslations) {
            this.cachedTranslations = this.getTranslations()
        }

        if (touch) {
            pageX = touch.pageX
            pageY = touch.pageY + topOffset
            clientX = touch.clientX
            clientY = touch.clientY
        } else {
            pageX = (event as PointerEvent).pageX
            pageY = (event as PointerEvent).pageY + topOffset
            clientX = (event as PointerEvent).clientX
            clientY = (event as PointerEvent).clientY
        }

        const boxX = pageX - this.cachedElementRect.left
        const boxY = pageY - this.cachedElementRect.top
        const percentX = boxX / this.cachedElementRect.width
        const percentY = boxY / this.cachedElementRect.height
        const isOutsideBox = percentX < 0 || percentX > 1 || percentY < 0 || percentY > 1
        const translations: Record<string, Point> = {}

        // calculate translation
        this.cachedTranslations.forEach((translation) => {
            if (translations[translation.id]) {
                console.warn(`[PointerBox] duplicate translation key ${translation.id}`)
            }

            translations[translation.id] = {
                x: (boxX * translation.x) - translation.left,
                y: (boxY * translation.y) - translation.top
            }
        })

        return {
            id: pointerInfo.id,
            type: pointerInfo.type,
            boxX,
            boxY,
            pageX,
            pageY,
            clientX,
            clientY,
            percentX,
            percentY,
            translations,
            isOutsideBox,
            originalEvent: event as PointerBox.OriginalEvent,
            cancel: () => this.cancel()
        }
    }

    private getMoveDetail(event: Event, pointer: PointerBox.Pointer, touch?: Touch): PointerBox.MoveDetail {
        if (!pointer.initial) throw new Error('[PointerBox] No initial details stored')
        if (!pointer.previous) throw new Error('[PointerBox] No previous details stored')

        const startDetail = this.getStartDetail(event, {
            id: pointer.id,
            type: pointer.type
        }, touch)

        const degreesFromInitial = Utils.getAngleBetweenPoints(
            { x: pointer.initial.boxX, y: pointer.initial.boxY },
            { x: startDetail.boxX, y: startDetail.boxY }
        )

        const distanceFromInitial = Utils.getDistanceBetweenPoints(
            { x: pointer.initial.boxX, y: pointer.initial.boxY },
            { x: startDetail.boxX, y: startDetail.boxY }
        )

        const degreesFromPrevious = Utils.getAngleBetweenPoints(
            { x: pointer.previous.boxX, y: pointer.previous.boxY },
            { x: startDetail.boxX, y: startDetail.boxY }
        )

        const distancefromPrevious = Utils.getDistanceBetweenPoints(
            { x: pointer.previous.boxX, y: pointer.previous.boxY },
            { x: startDetail.boxX, y: startDetail.boxY }
        )

        pointer.distanceAccumulator += distancefromPrevious

        let velocity = 0

        if (pointer.previousEventTimestamp) {
            velocity = Utils.getVelocity(
                { x: pointer.previous.boxX, y: pointer.previous.boxY },
                pointer.previousEventTimestamp,
                { x: startDetail.boxX, y: startDetail.boxY },
                Date.now()
            )
        }

        if (velocity) {
            pointer.velocityValues.unshift(velocity)
            pointer.velocityValues.length = Math.min(pointer.velocityValues.length, 5)
        }

        return {
            id: startDetail.id,
            type: startDetail.type,
            boxX: startDetail.boxX,
            boxY: startDetail.boxY,
            pageX: startDetail.pageX,
            pageY: startDetail.pageY,
            clientX: startDetail.clientX,
            clientY: startDetail.clientY,
            percentX: startDetail.percentX,
            percentY: startDetail.percentY,
            translations: startDetail.translations,
            isOutsideBox: startDetail.isOutsideBox,
            degreesFromInitial,
            distanceFromInitial,
            changeXFromInitial: startDetail.boxX - pointer.initial.boxX,
            changeYFromInitial: startDetail.boxY - pointer.initial.boxY,
            degreesFromPrevious,
            distancefromPrevious,
            changeXFromPrevious: startDetail.boxX - pointer.previous.boxX,
            changeYFromPrevious: startDetail.boxY - pointer.previous.boxY,
            totalDistance: pointer.distanceAccumulator,
            velocity,
            normalizedVelocity: pointer.velocityValues.reduce((a, b) => a + b) / pointer.velocityValues.length,
            originalEvent: startDetail.originalEvent,
            initial: pointer.initial,
            previous: pointer.previous,
            cancel: startDetail.cancel
        }
    }


    // Child Translation

    private getTranslations(): PointerBox.Translation[] {
        if (!this.cachedElementRect) throw Error('[PointerBox] Element rect is undefined')

        const translations: PointerBox.Translation[] = []
        const children = this.element.children

        for (let i = 0; i < children.length; i++) {
            const idAttribute = children[i].attributes.getNamedItem('data-pointerboxtranslateid')
            if (!idAttribute) continue

            const id = idAttribute.value
            if (!id) continue

            const widthAttribute = children[i].attributes.getNamedItem('data-pointerboxtranslatewidth')
            const heightAttribute = children[i].attributes.getNamedItem('data-pointerboxtranslateheight')
            const width = widthAttribute?.value ? parseInt(widthAttribute.value, 10) : this.cachedElementRect.width
            const height = heightAttribute?.value ? parseInt(heightAttribute.value, 10) : this.cachedElementRect.height
            const rect = children[i].getBoundingClientRect()

            translations.push({
                id,
                left: rect.left - this.cachedElementRect.left,
                top: rect.top - this.cachedElementRect.top,
                x: width / rect.width,
                y: height / rect.height
            })
        }

        return translations
    }


    // Polyfills and Hacks

    // HACK: iOS Child Target
    // https://github.com/w3c/pointerevents/issues/327

    // iOS does not correctly implement setPointerCapture if the initial target
    // is a child of this.element. This is fixed by disabling pointerEvents on
    // all top level children.
    private disableChildPointerEvents() {
        this.element.style.touchAction = 'none'

        for (let i = 0; i < this.element.children.length; i++) {
            const el = this.element.children[i] as HTMLElement
            el.style.pointerEvents = 'none'
            el.style.touchAction = 'none'
        }
    }

    private enableChildPointerEvents() {
        this.element.style.touchAction = ''

        for (let i = 0; i < this.element.children.length; i++) {
            const el = this.element.children[i] as HTMLElement
            el.style.pointerEvents = ''
            el.style.touchAction = ''
        }
    }


    // elementsFromPoint polyfill via
    // https://github.com/yinonc/polyfill-elements-from-point/

    private applyPolyfill() {
        if (PointerBox.isPolyfilled) return
        PointerBox.isPolyfilled = true

        if (!window) return
        if (!window.document) return
        // @ts-ignore
        if (window.document.elementsFromPoint) return

        window.document.elementsFromPoint = PointerBox.elementsFromPoint
    }

    static elementsFromPoint(x: number, y: number): HTMLElement[] {
        const elements: HTMLElement[] = []
        const pointerEvents: string[] = []
        let el: HTMLElement | null = null

        do {
            const topElement = window.document.elementFromPoint(x, y) as HTMLElement
            if (el !== topElement) {
                el = topElement
                elements.push(el)
                pointerEvents.push(el.style.pointerEvents)
                el.style.pointerEvents = 'none'
            } else {
                el = null
            }
        } while (el)

        elements.forEach((element, index) => {
            element.style.pointerEvents = pointerEvents[index]
        })

        return elements
    }
}

export namespace PointerBox {
    export type OriginalEvent = MouseEvent | TouchEvent | PointerEvent
    export type StaticEvent = CustomEvent<StartDetail>
    export type MoveEvent = CustomEvent<MoveDetail>
    export type SwipeEvent = CustomEvent<SwipeDetail>
    export type Direction = 'up' | 'down' | 'left' | 'right'

    export interface ConstructorOptions {
        isMultitouch?: boolean
        restrictToBox?: boolean
        swipeDistance?: number
        swipeVelocity?: number
    }

    export interface PointerInfo {
        id: number
        type: string
    }

    export interface Pointer extends PointerInfo {
        distanceAccumulator: number
        velocityValues: number[] // stores last 5 velocity values to provide an average
        children: Element[] // for tracking child click events
        previousEventTimestamp?: number
        initial?: PointerBox.StartDetail
        previous?: PointerBox.MoveDetail
    }

    export interface StartDetail extends PointerInfo {
        id: number
        type: string
        boxX: number
        boxY: number
        pageX: number
        pageY: number
        clientX: number
        clientY: number
        percentX: number
        percentY: number
        translations: Record<string, Point>
        isOutsideBox: boolean
        originalEvent: OriginalEvent
        cancel: () => void
    }

    export interface MoveDetail extends StartDetail {
        degreesFromInitial: number
        distanceFromInitial: number
        changeXFromInitial: number
        changeYFromInitial: number
        degreesFromPrevious: number
        distancefromPrevious: number
        changeXFromPrevious: number
        changeYFromPrevious: number
        totalDistance: number
        velocity: number
        normalizedVelocity: number
        initial: StartDetail
        previous: MoveDetail
    }

    export interface SwipeDetail extends MoveDetail {
        direction: Direction
    }

    export interface Translation {
        id: string
        left: number
        top: number
        x: number
        y: number
    }
}
