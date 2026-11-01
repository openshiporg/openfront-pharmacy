import { Crimson_Pro, Source_Sans_3 } from 'next/font/google'

// Antares: a bookish transitional serif (Crimson Pro) sets the store name, headings, navigation,
// product titles and prices; Source Sans 3 sets small print, forms and meta. Figures are tabular.
export const rxDisplay = Crimson_Pro({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap', variable: '--rx-font-display' })
export const rxSans = Source_Sans_3({ subsets: ['latin'], display: 'swap', variable: '--rx-font-sans' })

/** Font variables for the store wrapper and for portals rendered outside it. */
export const rxFontClass = `${rxDisplay.variable} ${rxSans.variable}`
