import simplify from 'simplify-js'
import type { DrawStage } from './DrawStage'

export class InteractCanvas {
    renderCanvas: HTMLCanvasElement
    canvases: InteractCanvas.CanvasObject[] = []
    maxPoints = Number.MAX_SAFE_INTEGER
    tolerance = 1.0

    // Drawful Animate variables
    lines: InteractCanvas.Line[] = []
    lines2: InteractCanvas.Line[] = []
    currentLine: InteractCanvas.Line = {
        color: '#000',
        thickness: 0,
        points: []
    }
    isSubmitting = false
    isInteracting = false
    currentColor = '#000'
    currentThickness = 4
    currentFrame = 0

    // Options
    width = 400
    height = 400

    constructor(el: HTMLElement, width: number, height: number, options: DrawStage.InitOptions) {
        this.width = width
        this.height = height
        this.renderCanvas = document.createElement('canvas')
        if (options.thickness) this.currentThickness = options.thickness
        if (options.color) this.currentColor = options.color
        if (options.maxPoints) this.maxPoints = options.maxPoints

        this.setupElements(el)
        // Set the initial color and thickness

        this.draw()
    }

    createCanvasObject(name: string) {
        const canvas = document.createElement('canvas')
        canvas.width = this.width
        canvas.height = this.height
        canvas.style.display = 'none'
        this.canvases.push({
            name,
            element: canvas,
            dirty: true
        })
    }

    getCanvasObject(name: string): InteractCanvas.CanvasObject {
        const canvasObject = this.canvases.find((canvas) => canvas.name === name)
        if (!canvasObject) throw new Error(`No canvas found with name ${name}`)
        return canvasObject
    }

    setupElements(el: HTMLElement) {
        this.renderCanvas.classList.add('draw-canvas')
        this.renderCanvas.width = this.width
        this.renderCanvas.height = this.height
        this.renderCanvas.style.width = '100%'
        this.renderCanvas.style.margin = '0px auto'
        this.renderCanvas.style.height = '100%'
        this.renderCanvas.style.top = '0'
        this.renderCanvas.style.left = '0'

        el.append(this.renderCanvas)

        this.createCanvasObject('inactive')
        this.createCanvasObject('active')
        this.createCanvasObject('line')
    }

    // Accessors
    get submitting(): boolean {
        return this.isSubmitting
    }

    set submitting(isSubmitting: boolean) {
        this.isSubmitting = isSubmitting
    }

    get color(): string {
        return this.currentColor
    }

    set color(hex: string) {
        this.currentColor = hex
    }

    get thickness(): number {
        return this.currentThickness
    }

    set thickness(t: number) {
        this.currentThickness = t
    }

    get frame(): number {
        return this.currentFrame
    }

    set frame(t: number) {
        this.currentFrame = t
        this.getCanvasObject('active').dirty = true
        this.getCanvasObject('inactive').dirty = true
        this.draw()
    }

    get canvasElement(): HTMLCanvasElement {
        return this.renderCanvas
    }

    toObject(): Record<string, any> {
        return {
            frame0: this.exportLines(this.lines),
            frame1: this.exportLines(this.lines2)
        }
    }

    // Events
    onDown(point: Point) {
        if (this.isSubmitting) return
        this.isInteracting = true
        this.addLine(point)
        this.getCanvasObject('line').dirty = true
        this.draw()
    }

    onMove(point: Point) {
        if (!this.isInteracting) return
        if (this.isSubmitting) return
        // When the position of the pointer is updated,
        // the distance to the brush is calculated.
        // If this distance is larger than the defined radius,
        // the brush will be moved by `distance - radius` pixels
        // in the direction where the pointer is.

        const lastPoint: Point | null = this.getLastDrawnPoint()
        if (!lastPoint) {
            this.addPoint(point)
            this.getCanvasObject('line').dirty = true
            return
        }
        const radius = 0.5 * this.thickness
        const vector = {
            x: point.x - lastPoint.x,
            y: point.y - lastPoint.y
        }

        const distance = Math.sqrt(
            (vector.x) ** 2
            + (vector.y) ** 2
        )
        if (distance > radius) {
            const ratio = (distance - radius) / distance
            const edgeVector = {
                x: vector.x * ratio,
                y: vector.y * ratio
            }
            const edgePoint = {
                x: lastPoint.x + edgeVector.x,
                y: lastPoint.y + edgeVector.y
            }

            this.addPoint(edgePoint)
            this.getCanvasObject('line').dirty = true
            this.draw()
        }
    }

    onUp() {
        if (this.isSubmitting) return
        if (!this.isInteracting) return
        this.isInteracting = false
        this.endLine()
        this.getCanvasObject('active').dirty = true
        this.getCanvasObject('line').dirty = true
        this.draw()
    }

    // Drawful Drawing
    addLine(initialPoint: Point) {
        const color = this.currentColor
        const thickness = this.currentThickness

        this.currentLine = {
            color,
            thickness,
            points: []
        }
        this.addPoint(initialPoint)
    }

    addPoint(point: Point) {
        const line = this.currentLine
        if (!line) return
        const clampedPoint = {
            x: Math.min(Math.max(0.5 * line.thickness, point.x), this.renderCanvas.width - 0.5 * line.thickness),
            y: Math.min(Math.max(0.5 * line.thickness, point.y), this.renderCanvas.height - 0.5 * line.thickness)
        }
        line.points.push(clampedPoint)
    }

    getLastDrawnPoint() {
        if (this.currentLine.points.length === 0) return null
        return this.currentLine.points[this.currentLine.points.length - 1]
    }

    endLine() {
        const frame = this.currentFrame
        const activeLines = (frame === 0) ? this.lines : this.lines2
        const newPoints = simplify(this.currentLine.points)
        activeLines.push({
            ...this.currentLine,
            points: newPoints
        })
        this.currentLine = {
            color: '#000',
            thickness: 0,
            points: []
        }
    }

    // Lines

    // converts lines with optional propeties and
    // stringified points into a standardized shape
    parseLines(lines: InteractCanvas.UnparsedLine[]): InteractCanvas.Line[] {
        let activeColor = '#000'
        let activeThickness = 1

        return lines.map((line) => {
            let points: { x: number, y: number }[] = []

            if (typeof line.points === 'string') {
                points = line.points.split('|').map((point) => {
                    const [x, y] = point.split(',')
                    return {
                        x: parseInt(x, 10),
                        y: parseInt(y, 10)
                    }
                })
            } else {
                points = line.points
            }

            if (line.color && line.color !== activeColor) {
                activeColor = line.color
            }

            if (line.thickness && line.thickness !== activeThickness) {
                activeThickness = line.thickness
            }

            return {
                color: activeColor,
                thickness: activeThickness,
                points
            }
        })
    }

    exportLines(lines: InteractCanvas.Line[]): InteractCanvas.UnparsedLine[] {
        return lines.map((line) => ({
            ...line,
            points: line.points.map((point) => `${point.x},${point.y}`).join('|')
        }))
    }

    // Canvas
    draw() {
        // *** New way ***
        const renderCtx = this.renderCanvas.getContext('2d')
        if (!renderCtx) return
        renderCtx.clearRect(0, 0, this.width, this.height)

        // Inactive Frame
        const inactiveFrameCanvas = this.getCanvasObject('inactive')
        if (inactiveFrameCanvas.dirty) {
            const ctx = inactiveFrameCanvas.element.getContext('2d') as CanvasRenderingContext2D
            ctx.clearRect(0, 0, this.width, this.height)
            const inactiveFrameLines = (this.currentFrame === 0) ? this.lines2 : this.lines
            inactiveFrameLines.forEach((line) => this.drawLine(ctx, line))
            inactiveFrameCanvas.dirty = false
        }
        renderCtx.save()
        renderCtx.globalAlpha = 0.1
        renderCtx.drawImage(inactiveFrameCanvas.element, 0, 0)
        renderCtx.restore()

        // Active frame
        const activeFrameCanvas = this.getCanvasObject('active')
        if (activeFrameCanvas.dirty) {
            const ctx = activeFrameCanvas.element.getContext('2d') as CanvasRenderingContext2D
            ctx.clearRect(0, 0, this.width, this.height)
            const activeFrameLines = (this.currentFrame === 0) ? this.lines : this.lines2

            activeFrameLines.forEach((line) => this.drawLine(ctx, line))
            activeFrameCanvas.dirty = false
        }
        renderCtx.drawImage(activeFrameCanvas.element, 0, 0)

        // Current line
        const lineCanvas = this.getCanvasObject('line')
        if (lineCanvas.dirty) {
            const ctx = lineCanvas.element.getContext('2d') as CanvasRenderingContext2D
            ctx.clearRect(0, 0, this.width, this.height)
            this.drawLine(ctx, this.currentLine)
            lineCanvas.dirty = false
        }
        renderCtx.drawImage(lineCanvas.element, 0, 0)
    }

    drawLine(ctx: CanvasRenderingContext2D, line: InteractCanvas.Line) {
        ctx.strokeStyle = line.color
        ctx.lineWidth = line.thickness
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.fillStyle = line.color
        ctx.strokeStyle = line.color

        ctx.beginPath()
        line.points.forEach((point, i) => {
            if (i === 0) {
                ctx.save()
                // We need to fill a dot bc iOS Safari doesn't do 0 radius arcs
                // Or 0 distance lines
                ctx.arc(point.x, point.y, line.thickness / 2, 0, 2 * Math.PI)
                ctx.fill()
                ctx.restore()
                ctx.beginPath() // Start a new path or else you'll be stroking the arc too
                ctx.moveTo(point.x, point.y)
            }
            ctx.lineTo(point.x, point.y)
        })
        ctx.stroke()
    }
}

export namespace InteractCanvas {
    export interface UnparsedLine {
        color?: string
        thickness?: number
        points: Point[] | string
    }

    export interface Line {
        color: string
        thickness: number
        points: Point[]
    }

    export interface CanvasObject {
        name: string
        element: HTMLCanvasElement
        dirty: boolean
    }
}
