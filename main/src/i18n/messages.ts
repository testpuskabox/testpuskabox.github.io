import type { I18n } from '@tv/shared'

import en from './en.json'

import fr from './fr.json'
import it from './it.json'
import de from './de.json'
import es from './es.json'
import esXL from './es-XL.json'

export const messages: I18n.Messages<typeof en> = {
    en,
    fr,
    it,
    de,
    es,
    'es-XL': esXL
}
