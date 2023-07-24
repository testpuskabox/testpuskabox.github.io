import type { Artifacts } from '@tv/shared'

export const games: Games.Game[] = [
    // Internal
    {
        name: 'Prototype',
        tag: 'prototype',
        wrapper: 'vue',
        isPublic: true,
        directory: 'internal/prototype'
    },

    {
        name: 'EcastTestClient',
        tag: 'ecast-test-client',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'internal/ecast-test-client'
    },

    // Standalone
    {
        name: 'Quiplash 2 InterLASHional',
        tag: 'quiplash2-international',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'standalone/quiplash2-international',
        categoryId: 'quiplash2-internationalGame'
    },

    {
        name: 'Guesspionage Crowdplay',
        tag: 'guesspionage-crowdplay',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'standalone/guesspionage-crowdplay'
    },

    {
        name: 'Drawful 2',
        tag: 'drawful2',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'standalone/drawful2',
        categoryId: 'DrawfulGame',
        shopItems: ['shirts']
    },

    {
        name: 'Drawful 2',
        tag: 'drawful2international',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'standalone/drawful2-international',
        features: ['moderation']
    },

    {
        name: 'Acquisitions, Inc.',
        tag: 'acquisitions-inc',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'standalone/acquisitions-inc'
    },

    // Party Pack 1
    {
        name: 'You Don\'t Know Jack 2015',
        tag: 'ydkj2015',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp1/ydkj2015'
    },

    {
        name: 'Drawful',
        tag: 'drawful',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp1/drawful'
    },

    {
        name: 'Word Spud',
        tag: 'wordspud',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp1/wordspud'
    },

    {
        name: 'Lie Swatter',
        tag: 'lieswatter',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp1/lieswatter'
    },

    {
        name: 'Fibbage',
        tag: 'fibbage',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp1/fibbage'
    },

    // Party Pack 2
    {
        name: 'Fibbage 2',
        tag: 'fibbage2',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp2/fibbage2'
    },

    {
        name: 'Earwax',
        tag: 'earwax',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp2/earwax'
    },

    {
        name: 'Bidiots',
        tag: 'auction',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp2/auction'
    },

    {
        name: 'Bomb Corp',
        tag: 'bombintern',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp2/bombintern'
    },

    {
        name: 'Quiplash',
        tag: 'quiplash',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp2/quiplash'
    },

    // Party Pack 3
    {
        name: 'Fakin\' It',
        tag: 'fakinit',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp3/fakinit'
    },

    {
        name: 'Tee K.O.',
        tag: 'awshirt',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp3/awshirt',
        categoryId: 'TeeKOGame',
        shopItems: ['shirts']
    },

    {
        name: 'Quiplash 2',
        tag: 'quiplash2',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp3/quiplash2',
        categoryId: 'Quiplash2Game'
    },

    {
        name: 'Trivia Murder Party',
        tag: 'triviadeath',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp3/triviadeath',
        categoryId: 'TriviaDeathResults'
    },

    {
        name: 'Guesspionage',
        tag: 'pollposition',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp3/pollposition'
    },

    // Party Pack 4
    {
        name: 'Fibbage 3',
        tag: 'fibbage3',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp4/fibbage3'
    },

    {
        name: 'Survive the Internet',
        tag: 'survivetheinternet',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp4/survivetheinternet',
        categoryId: 'STIGame'
    },

    {
        name: 'Monster Seeking Monster',
        tag: 'monstermingle',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp4/monstermingle',
        categoryId: 'MonsterMingleGame'
    },

    {
        name: 'Bracketeering',
        tag: 'bracketeering',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp4/bracketeering',
        categoryId: 'BRKGame'
    },

    {
        name: 'Civic Doodle',
        tag: 'overdrawn',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp4/overdrawn',
        categoryId: 'OverdrawnGame',
        shopItems: ['shirts']
    },

    // Party Pack 5
    {
        name: 'You Don\'t Know Jack: Full Stream',
        tag: 'ydkj2018',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp5/ydkj2018',
        categoryId: 'YDKJ2018Game'
    },

    {
        name: 'Split the Room',
        tag: 'splittheroom',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp5/splittheroom',
        categoryId: 'SplitTheRoomGame'
    },

    {
        name: 'Mad Verse City',
        tag: 'rapbattle',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp5/rapbattle',
        categoryId: 'RapBattleGame'
    },

    {
        name: 'Zeeple Dome',
        tag: 'slingshoot',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp5/slingshoot',
        categoryId: 'SlingShootGame'
    },

    {
        name: 'Patently Stupid',
        tag: 'patentlystupid',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp5/patentlystupid',
        categoryId: 'PatentlyStupidGame',
        shopItems: ['mugs']
    },

    // Party Pack 6
    {
        name: 'Trivia Murder Party 2',
        tag: 'triviadeath2',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp6/triviadeath2',
        categoryId: 'TriviaDeath2Game'
    },

    {
        name: 'Role Models',
        tag: 'rolemodels',
        wrapper: 'marionette',
        isPublic: true,
        features: ['camera'],
        directory: 'pp6/rolemodels',
        categoryId: 'RoleModelsGame',
        shopItems: ['shirts']
    },

    {
        name: 'Joke Boat',
        tag: 'jokeboat',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp6/jokeboat',
        categoryId: 'JokeboatGame'
    },

    {
        name: 'Dictionarium',
        tag: 'ridictionary',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp6/ridictionary',
        categoryId: 'RidictionaryGame'
    },

    {
        name: 'Push the Button',
        tag: 'pushthebutton',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp6/pushthebutton',
        categoryId: 'PushTheButtonGame'
    },

    // Party Pack 7
    {
        name: 'Talking Points',
        tag: 'jackbox-talks',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp7/jackboxtalks',
        features: ['camera', 'moderation'],
        categoryId: 'JackboxTalksGame'
    },

    {
        name: 'Quiplash 3',
        tag: 'quiplash3',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp7/quiplash3',
        features: ['moderation'],
        categoryId: 'quiplash3Game'
    },

    {
        name: 'The Devils and the Details',
        tag: 'everyday',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp7/everyday',
        categoryId: 'EverydayGame',
        shopItems: ['mugs']
    },

    {
        name: 'Champ\'d Up',
        tag: 'worldchamps',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp7/worldchamps',
        features: ['moderation'],
        categoryId: 'WorldChampionsGame',
        shopItems: ['cards']
    },

    {
        name: 'Blather \'Round',
        tag: 'blanky-blank',
        wrapper: 'marionette',
        isPublic: true,
        directory: 'pp7/blanky-blank',
        categoryId: 'BlankyBlankGame'
    },

    // Party Pack 8
    {
        name: 'Job Job',
        tag: 'apply-yourself',
        wrapper: 'vue',
        isPublic: true,
        directory: 'pp8/apply-yourself',
        categoryId: 'JobGameGame',
        features: ['moderation', 'previews']
    },

    {
        name: 'Drawful Animate',
        tag: 'drawful-animate',
        wrapper: 'vue',
        isPublic: true,
        directory: 'pp8/drawful-animate',
        categoryId: 'DrawfulAnimateGame',
        features: ['moderation']
    },

    {
        name: 'The Wheel of Enormous Proportions',
        tag: 'the-wheel',
        wrapper: 'vue',
        isPublic: true,
        directory: 'pp8/the-wheel',
        categoryId: 'TheWheelGame'
    },

    {
        name: 'The Poll Mine',
        tag: 'survey-bomb',
        wrapper: 'vue',
        isPublic: true,
        directory: 'pp8/survey-bomb',
        categoryId: 'SurveyBombGame'
    },

    {
        name: 'Weapons Drawn',
        tag: 'murder-detectives',
        wrapper: 'vue',
        isPublic: true,
        directory: 'pp8/murder-detectives',
        categoryId: 'MurderDetectivesGame',
        features: ['moderation']
    },


    // The Jackbox Party Starter
    {
        name: 'Quiplash 3',
        tag: 'quiplash3-tjsp',
        wrapper: 'vue',
        isPublic: true,
        directory: 'tjsp/quiplash3',
        features: ['moderation'],
        categoryId: 'quiplash3Game'
    },

    {
        name: 'Tee K.O.',
        tag: 'awshirt-tjsp',
        wrapper: 'vue',
        isPublic: true,
        directory: 'tjsp/awshirt',
        features: ['moderation'],
        shopItems: ['shirts'],
        categoryId: 'TeeKOGame'
    },

    {
        name: 'Trivia Murder Party 2',
        tag: 'triviadeath2-tjsp',
        wrapper: 'vue',
        isPublic: true,
        directory: 'tjsp/triviadeath2',
        categoryId: 'TriviaMurderParty2Game'
    },

    // Party Pack 9
    {
        name: 'Fibbage 4',
        tag: 'fourbage',
        wrapper: 'vue',
        isPublic: true,
        directory: 'pp9/fourbage',
        features: ['moderation', 'kicking'],
        categoryId: 'Fibbage4Game'
    },

    {
        name: 'Roomerang',
        tag: 'htmf',
        wrapper: 'vue',
        isPublic: false,
        directory: 'pp9/htmf',
        features: ['moderation', 'kicking'],
        categoryId: 'MakeFriendsGame'
    },

    {
        name: 'Junktopia',
        tag: 'antique-freak',
        wrapper: 'vue',
        isPublic: true,
        directory: 'pp9/antique-freak',
        features: ['moderation', 'kicking'],
        categoryId: 'AntiqueGameGame'
    },

    {
        name: 'Nonsensory',
        tag: 'range-game',
        wrapper: 'vue',
        isPublic: true,
        directory: 'pp9/range-game',
        features: ['moderation', 'kicking'],
        categoryId: 'RangeGameGame'
    },
    {
        name: 'Quixort',
        tag: 'lineup',
        wrapper: 'vue',
        isPublic: true,
        directory: 'pp9/lineup',
        features: ['kicking'],
        categoryId: 'LineupGame'
    },

    // Party Pack 10
    {
        name: 'Tee K.O. 2',
        tag: 'awshirt',
        wrapper: 'vue',
        isPublic: true,
        directory: 'pp10/awshirt2',
        features: ['moderation', 'kicking'],
        shopItems: ['shirts'],
        categoryId: 'TeeKO2Game'
    },
    {
        name: 'Nopus Opus',
        tag: 'nopus-opus',
        wrapper: 'vue',
        isPublic: false,
        directory: 'pp10/nopus-opus',
        features: ['kicking'],
        shopItems: [],
        categoryId: 'NopusOpusGame'
    },
    {
        name: 'Risky Text',
        tag: 'risky-text',
        wrapper: 'vue',
        isPublic: false,
        directory: 'pp10/risky-text',
        features: ['moderation', 'kicking'],
        shopItems: [],
        categoryId: 'RiskyTextGame'
    },
    {
        name: 'Time Trivia',
        tag: 'time-trivia',
        wrapper: 'vue',
        isPublic: false,
        directory: 'pp10/time-trivia',
        features: ['kicking'],
        shopItems: [],
        categoryId: 'TimeTriviaGame'
    },
    {
        name: 'Us & Them',
        tag: 'us-them',
        wrapper: 'vue',
        isPublic: false,
        directory: 'pp10/us-them',
        features: ['kicking'],
        shopItems: [],
        categoryId: 'UsThemGame'
    }
]

/**
 * Get a game by either tag or category id.
 */
export const getGame = (identifier: string): Games.Game | undefined => (
    games.find((game) => {
        if (game.tag === identifier) return true
        if (game.categoryId === identifier) return true
        return false
    })
)

/**
 * Gets an array of all games that point to a directory. Useful
 * in allowing multiple app tags to point to a single game.
 */
export const getGamesByDirectory = (directory: string): Games.Game[] => games.filter((game) => game.directory === directory)

export namespace Games {
    export type Wrapper = 'vue' | 'marionette'
    export type ShopItem = 'cards' | 'mugs' | 'shirts'
    export type Feature = 'camera' | 'kicking' | 'moderation' | 'previews'

    export interface Game {
        name?: string
        tag: string
        wrapper: Wrapper
        isPublic: boolean
        directory: string
        features?: Feature[]
        categoryId?: string
        shopItems?: ShopItem[]
    }

    export interface PastGame {
        artifact: Artifacts.LocalArtifact
        game?: Game
    }
}
