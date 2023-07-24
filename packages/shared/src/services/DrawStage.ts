import { InteractCanvas } from './InteractCanvas'

export class DrawStage {
    private stageElement: HTMLElement
    private width = 400
    private height = 400
    interactCanvas: InteractCanvas
    private isDrawing = false
    private callbacks: Record<string, ((...args: any[]) => void)[]> = {}

    private capturedPointer?: {
        pointerId: number,
        pointerType: string
    }

    constructor(el: HTMLElement, options: DrawStage.InitOptions) {
        if (options.width) this.width = options.width
        if (options.height) this.height = options.height

        this.stageElement = el
        this.setupElements()
        this.setupEvents()

        if (options.InteractCanvas) {
            this.interactCanvas = new options.InteractCanvas(el, this.width, this.height, options)
        } else {
            this.interactCanvas = new InteractCanvas(el, this.width, this.height, options)
        }
    }

    // Event Emitter
    on(event: string, callback: (...args: any[]) => void) {
        this.callbacks[event] = this.callbacks[event] || []
        this.callbacks[event].push(callback)
    }

    off(event: string, callback: (...args: any[]) => void) {
        this.callbacks[event] = (this.callbacks[event] || []).filter((fn) => fn !== callback)
    }

    emit(event: string, ...args: any[]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        (this.callbacks[event] || []).map((fn) => fn(...args))
    }

    beforeDestroy() {
        this.tearDownEvents()
    }

    get canvas() {
        return this.interactCanvas
    }

    getObject() {
        return this.interactCanvas.toObject()
    }

    private setupElements() {
        this.stageElement.style.touchAction = 'none'
    }

    // Events
    private setupEvents() {
        if (typeof PointerEvent === 'function') {
            this.stageElement.addEventListener('pointerdown', this.onPointerDown)
            this.stageElement.addEventListener('pointermove', this.onPointerMove)
            this.stageElement.addEventListener('lostpointercapture', this.onLostPointerCapture)
            this.stageElement.addEventListener('pointerup', this.onPointerEnd)
        } else {
            this.stageElement.addEventListener('mousedown', this.onMouseDown)
            this.stageElement.addEventListener('mousemove', this.onMouseMove)
            document.addEventListener('mouseup', this.onMouseUp.bind(this.stageElement))

            this.stageElement.addEventListener('touchstart', this.onTouchStart)
            this.stageElement.addEventListener('touchmove', this.onTouchMove)
            this.stageElement.addEventListener('touchcancel', this.onTouchCancel)
            this.stageElement.addEventListener('touchend', this.onTouchEnd)
        }
    }

    private tearDownEvents() {
        if (typeof PointerEvent === 'function') {
            this.stageElement.removeEventListener('pointerdown', this.onPointerDown)
            this.stageElement.removeEventListener('pointermove', this.onPointerMove)
            this.stageElement.removeEventListener('lostpointercapture', this.onLostPointerCapture)
            this.stageElement.removeEventListener('pointerup', this.onPointerEnd)
        } else {
            this.stageElement.removeEventListener('mousedown', this.onMouseDown)
            this.stageElement.removeEventListener('mousemove', this.onMouseMove)
            document.removeEventListener('mouseup', this.onMouseUp)

            this.stageElement.removeEventListener('touchstart', this.onTouchStart)
            this.stageElement.removeEventListener('touchmove', this.onTouchMove)
            this.stageElement.removeEventListener('touchcancel', this.onTouchCancel)
            this.stageElement.removeEventListener('touchend', this.onTouchEnd)
        }
    }

    private onPointerDown = (event: PointerEvent) => {
        event.preventDefault()
        if (!event.isPrimary) return // Every pointerType has a primary
        if (this.capturedPointer) return
        const point = this.getEventPoint(event)
        this.interactCanvas.onDown(point)
        this.stageElement.setPointerCapture(event.pointerId)
        this.capturedPointer = {
            pointerId: event.pointerId,
            pointerType: event.pointerType
        }
    }

    private onPointerMove = (event: PointerEvent) => {
        event.preventDefault()
        if (!this.capturedPointer) return
        if (!event.isPrimary) return
        if (event.pointerType !== this.capturedPointer.pointerType) return
        const point = this.getEventPoint(event)
        this.interactCanvas.onMove(point)
    }

    private onLostPointerCapture = (event: PointerEvent) => {
        event.preventDefault()
        if (!this.capturedPointer) return
        if (!event.isPrimary) return
        if (event.pointerType !== this.capturedPointer.pointerType) return
        this.interactCanvas.onUp()
        this.emit('up')
        const pointerId = this.capturedPointer.pointerId
        if (this.stageElement.hasPointerCapture(pointerId)) this.stageElement.releasePointerCapture(pointerId)
        this.capturedPointer = undefined
    }

    private onPointerEnd = (event: PointerEvent) => {
        event.preventDefault()
        if (!this.capturedPointer) return
        if (!event.isPrimary) return
        if (event.pointerType !== this.capturedPointer.pointerType) return
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1583480
        // Wacom tablet users on Windows/Firefox/no Windows Ink
        // Need to have the pointer stored
        this.interactCanvas.onUp()
        this.emit('up')
        const pointerId = this.capturedPointer.pointerId // event.pointerId
        if (this.stageElement.hasPointerCapture(pointerId)) this.stageElement.releasePointerCapture(pointerId)
        this.capturedPointer = undefined
    }

    private onMouseDown = (event: MouseEvent) => {
        event.preventDefault()
        const point = this.getEventPoint(event)
        this.interactCanvas.onDown(point)
        this.isDrawing = true
    }

    private onMouseMove = (event: MouseEvent) => {
        event.preventDefault()
        if (!this.isDrawing) return
        const point = this.getEventPoint(event)
        this.interactCanvas.onMove(point)
    }

    private onMouseUp = (event: MouseEvent) => {
        event.preventDefault()
        this.interactCanvas.onUp()
        this.isDrawing = false
        this.emit('up')
    }

    private onTouchStart = (event: TouchEvent) => {
        event.preventDefault()
        const point = this.getEventPoint(event.touches[0])
        this.interactCanvas.onDown(point)
        this.isDrawing = true
    }

    private onTouchMove = (event: TouchEvent) => {
        event.preventDefault()
        if (!this.isDrawing) return
        const point = this.getEventPoint(event.touches[0])
        this.interactCanvas.onMove(point)
    }

    private onTouchCancel = (event: TouchEvent) => {
        event.preventDefault()
        this.interactCanvas.onUp()
        this.isDrawing = false
        this.emit('up')
    }

    private onTouchEnd = (event: TouchEvent) => {
        event.preventDefault()
        this.interactCanvas.onUp()
        this.isDrawing = false
        this.emit('up')
    }

    private getPropValue(style: CSSStyleDeclaration, value: string): number {
        return parseFloat(style.getPropertyValue(value)) || 0
    }

    private getCanvasOffset(): DrawStage.CanvasOffsetObject {
        // we need to account for CSS scale, transform, border, padding,
        // and margin in order to get the correct scale and offset of the
        const canvas = this.interactCanvas.canvasElement
        const canvasStyle = window.getComputedStyle(canvas)
        const rect = canvas.getBoundingClientRect()

        // @see https://stackoverflow.com/a/53405390/2124254
        const transform: string[] | number[] = canvasStyle.transform !== 'none'
            ? canvasStyle.transform.replace('matrix(', '').split(',')
            : ['1', '1', '1', '1']
        const transformScaleX = parseFloat(transform[0])
        const transformScaleY = parseFloat(transform[3])

        // scale transform applies to the border and padding of the element
        const borderWidth = (this.getPropValue(canvasStyle, 'border-left-width')
            + this.getPropValue(canvasStyle, 'border-right-width'))
            * transformScaleX
        const borderHeight = (this.getPropValue(canvasStyle, 'border-top-width')
            + this.getPropValue(canvasStyle, 'border-bottom-width'))
            * transformScaleY

        const paddingWidth = (this.getPropValue(canvasStyle, 'padding-left')
            + this.getPropValue(canvasStyle, 'padding-right'))
            * transformScaleX
        const paddingHeight = (this.getPropValue(canvasStyle, 'padding-top')
            + this.getPropValue(canvasStyle, 'padding-bottom'))
            * transformScaleY

        return {
            scaleX: (rect.width - borderWidth - paddingWidth) / canvas.width,
            scaleY: (rect.height - borderHeight - paddingHeight) / canvas.height,
            offsetX: rect.left
                + (this.getPropValue(canvasStyle, 'border-left-width') + this.getPropValue(canvasStyle, 'padding-left'))
                * transformScaleX,
            offsetY: rect.top
                + (this.getPropValue(canvasStyle, 'border-top-width') + this.getPropValue(canvasStyle, 'padding-top'))
                * transformScaleY
        }
    }

    private getEventPoint(event: PointerEvent | MouseEvent | Touch): Point {
        const {
            scaleX,
            scaleY,
            offsetX,
            offsetY
        } = this.getCanvasOffset()

        const clientX: number = event.clientX
        const clientY: number = event.clientY

        let x = (clientX - offsetX) / scaleX
        let y = (clientY - offsetY) / scaleY

        // Keep inside canvas
        x = Math.max(0, Math.min(this.width, x))
        y = Math.max(0, Math.min(this.height, y))

        // Integers
        x = Math.round(x)
        y = Math.round(y)

        return { x, y }
    }
}

export namespace DrawStage {
    export interface InitOptions {
        InteractCanvas?: typeof InteractCanvas
        width?: number
        height?: number
        color?: string
        thickness?: number
        maxPoints?: number
    }

    export type CanvasOffsetObject = {
        scaleX: number
        scaleY: number
        offsetX: number
        offsetY: number
    }
}
