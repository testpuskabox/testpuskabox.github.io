import { Games, getGame } from '@games/games'

export class FeatureDetector {
    static async warningsForAppTag(tag: string): Promise<FeatureDetector.Warning[]> {
        const warnings: FeatureDetector.Warning[] = []
        const game = getGame(tag)

        if (!this.isCanvasSupported) warnings.push('canvas')
        if (!this.isFlexboxSupported) warnings.push('flexbox')
        if (game?.features?.includes('camera') && !await this.isCameraSupported) warnings.push('camera')
        return warnings
    }

    private static get isCanvasSupported(): boolean {
        const el = document.createElement('canvas')
        return !!(el.getContext && el.getContext('2d'))
    }

    private static get isFlexboxSupported(): boolean {
        try {
            return CSS.supports('flex-wrap', 'wrap')
        } catch (e) {
            return false
        }
    }

    private static get isCameraSupported(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            navigator.mediaDevices?.enumerateDevices()
                .then((devices) => resolve(devices.some((device) => device.kind === 'videoinput')))
                .catch((err) => reject(err))
        })
    }
}

export namespace FeatureDetector {
    export type Warning = Games.Feature | 'flexbox' | 'canvas'
}
