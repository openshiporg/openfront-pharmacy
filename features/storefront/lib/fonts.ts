import { Gloock, Hanken_Grotesk } from 'next/font/google'

// Gloock, a sign-writer's high-contrast serif, letters the store name, headings and prices like
// gold leaf on a cabinet; Hanken Grotesk sets everything read. Figures use tabular numerals.
export const rxDisplay = Gloock({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--rx-font-display' })
export const rxSans = Hanken_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--rx-font-sans' })

/** Font variables for the store wrapper and for portals rendered outside it. */
export const rxFontClass = `${rxDisplay.variable} ${rxSans.variable}`
