import { GetRoomReply, WSClient } from '@jackboxgames/ecast'
import { getGame } from '@games/games'
import { log } from '@tv/shared'

// A class of static functions to send feedback to Slack.
// Only available on non-production environments.

export class FeedbackSender {
    // attempts to guess the current content based on common data pattens.
    // game specific logic game also be called based on appTag
    static getPromptGuess(values: Record<string, any>, appTag: string): string | void {
        if (values.player?.prompt) return values.player.prompt
        if (values.audience?.prompt) return values.audience.prompt
        if (values.audiencePlayer?.prompt) return values.audiencePlayer.prompt
        if (values.prompt) return values.prompt

        if (appTag === 'range-game') return this.getRangeGameGuess(values)
    }


    // Game Specific Logic

    private static getRangeGameGuess(values: Record<string, any>): string | void {
        if (values.player?.content?.text) return values.player?.content?.text
        if (values.content?.content?.text) return values.content?.content?.text
    }


    // Sends

    static async send(options: FeedbackSender.SendOptions) {
        const data = {
            appTag: options.room.appTag,
            state: {
                appTag: options.room.appTag,
                name: options.name,
                role: options.role,
                code: options.room.code,
                message: options.message,
                vibe: options.vibe,
                state: options.values
            }
        }

        try {
            const url = await this.sendToEcast(data)
            await this.sendToSlack(url, options)
        } catch (error) {
            console.error(error)
        }
    }

    private static async sendToEcast(data: Record<string, any>): Promise<string> {
        const response = await fetch('https://ecast.jackboxgames.com/api/v2/controller/state', {
            method: 'POST',
            body: JSON.stringify(data)
        })

        const json = await response.json() as { body: { url: string }}
        return json.body.url
    }

    /* eslint-disable camelcase */
    private static async sendToSlack(url: string, options: FeedbackSender.SendOptions) {
        const gameInfo = getGame(options.room.appTag)
        const slackUrl = import.meta.env.TV_SLACK_FEEDBACK
        if (!slackUrl) return

        const emojis = {
            good: ':large_green_circle:',
            meh: ':large_yellow_circle:',
            bad: ':red_circle:'
        }

        // text
        const gameName = gameInfo?.name ?? options.room.appTag
        const text = `${gameName} :${options.room.appTag}: \n\n From: ${options.name},\n${options.message}`

        // context
        const contextElements = []

        if (options.vibe && options.vibe !== 'none') {
            contextElements.push({
                type: 'plain_text',
                text: `${emojis[options.vibe]} ${options.vibe.toUpperCase()} Vibes`,
                emoji: true
            })
        }

        if (options.content) {
            contextElements.push({
                type: 'plain_text',
                text: `Content: ${options.content}`,
                emoji: true
            })
        }

        const blocks = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text
                }
            },
            {
                type: 'context',
                elements: contextElements
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        action_id: 'actionId-0',
                        url,
                        text: {
                            type: 'plain_text',
                            text: 'View Game State JSON',
                            emoji: true
                        }
                    }
                ]
            }
        ]

        const slackPayload = { blocks }

        try {
            const doneResponse = await fetch(slackUrl, {
                method: 'POST',
                body: JSON.stringify(slackPayload)
            })

            const doneText = await doneResponse.text()
            log('[Feedback] sendToSlack', doneText)
        } catch (error) {
            console.error('[Feedback] sendToSlack', error)
        }
    }
}

export namespace FeedbackSender {
    export type Vibe = 'none' | 'good' | 'meh' | 'bad'

    export interface SendOptions {
        room: GetRoomReply
        name: string
        role: WSClient.Role
        content: string | null
        message: string
        vibe: Vibe
        values: JSONObject
    }
}
