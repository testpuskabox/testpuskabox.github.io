import { I18n } from './I18n'
import { Storage } from './Storage'

export class Artifacts {
    artifacts: Artifacts.LocalArtifact[]

    get hasUnviewed(): boolean {
        return this.artifacts.some((artifact) => !artifact.viewed)
    }


    constructor() {
        this.artifacts = this.list()
    }

    add(artifact: Artifacts.GameArtifact, appTag?: string): void {
        Artifacts.add(artifact, appTag)
        this.artifacts = this.list()
    }

    static add(artifact: Artifacts.GameArtifact, appTag?: string): void {
        if (!Storage.isSupported) return

        const scheme = this.isTestArtifact(artifact) ? 'http' : 'https'
        const domain = this.isTestArtifact(artifact) ? 'games-test.jackbox.tv' : 'games.jackbox.tv'
        const url = `${scheme}://${domain}/artifact/${artifact.categoryId}/${artifact.artifactId}/`
        const artifacts = Storage.get('galleries') || '[]'

        try {
            const artifactsArray: Artifacts.StorageArtifact[] = JSON.parse(artifacts) || []

            // If any existing gallery is the same url
            if (artifactsArray.some((artifact) => artifact.url === url)) return

            artifactsArray.unshift({
                url,
                time: new Date().getTime(),
                categoryId: artifact.categoryId,
                viewed: false
            })

            Storage.set('galleries', JSON.stringify(artifactsArray.slice(0, 40)))
        } catch (e) {
            console.warn('[Artifacts] Unable to add artifact to local storage')
        }
    }

    remove(index: number) {
        if (!Storage.isSupported) return
        const artifacts = Storage.get('galleries') || '[]'

        try {
            const parsedArtifacts: Artifacts.StorageArtifact[] = JSON.parse(artifacts) || []
            parsedArtifacts.splice(index, 1)
            Storage.set('galleries', JSON.stringify(parsedArtifacts))
            this.artifacts = this.list()
        } catch (error) {
            console.warn('[Artifacts] Unable to remove artifact')
        }
    }

    setAsViewed(index: number) {
        Artifacts.setAsViewed(index)
        this.artifacts = this.list()
    }

    static setAsViewed(index: number) {
        if (!Storage.isSupported) return
        const artifacts = Storage.get('galleries') || '[]'

        try {
            const parsedArtifacts: Artifacts.StorageArtifact[] = JSON.parse(artifacts) || []
            if (parsedArtifacts.length) {
                parsedArtifacts[index].viewed = true
            }
            Storage.set('galleries', JSON.stringify(parsedArtifacts))
        } catch (error) {
            console.warn(`[Artifacts] Unable to mark artifact ${index} as viewed`)
        }
    }

    static isTestArtifact(artifact?: Artifacts.GameArtifact) {
        return artifact?.rootId?.indexOf('test') !== -1
    }

    private list(): Artifacts.LocalArtifact[] {
        if (!Storage.isSupported) return []

        const formtter = new Intl.DateTimeFormat(I18n.locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })

        const artifacts = Storage.get('galleries') || '[]'
        const now = Date.now()

        try {
            const parsedArtifacts: Artifacts.StorageArtifact[] = JSON.parse(artifacts) || []
            return parsedArtifacts
                .filter((artifact) => (now - artifact.time < 525600 * 60 * 1000)) // Less than 1 year old
                .map((artifact) => {
                    const time = new Date(artifact.time)
                    const date = formtter.format(time)
                    const splitURL = artifact.url.split('/')

                    const id = splitURL[splitURL.length - 1] === ''
                        ? splitURL[splitURL.length - 2]
                        : splitURL[splitURL.length - 1]

                    let gameName = artifact.categoryId
                    if (!gameName) { // This can be removed January 2022
                        if (artifact.url.indexOf('Quiplash2') !== -1) gameName = 'Quiplash2Game'
                        else if (artifact.url.indexOf('Drawful') !== -1) gameName = 'DrawfulGame'
                        else if (artifact.url.indexOf('TeeKO') !== -1) gameName = 'TeeKOGame'
                        else if (artifact.url.indexOf('TriviaDeath') !== -1) gameName = 'TriviaDeathResults'
                    }

                    return {
                        id,
                        gameName,
                        date,
                        ...artifact
                    }
                })
        } catch (error) {
            console.warn('[Artifacts] Unable to parse artifacts array')
            return []
        }
    }
}

export namespace Artifacts {
    export interface GameArtifact {
        rootId?: string
        categoryId: string
        artifactId: string
    }

    export interface StorageArtifact {
        categoryId: string
        url: string
        time: number
        viewed: boolean
    }

    export interface LocalArtifact extends StorageArtifact {
        id: string
        gameName: string
        date: string
    }
}
