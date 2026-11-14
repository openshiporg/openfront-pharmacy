import { Figtree } from 'next/font/google'

// Vega: one rounded geometric sans (Figtree) sets the store name, headings, navigation, product
// titles, prices, small print and forms. Figures are tabular.
export const rxDisplay = Figtree({ subsets: ['latin'], weight: ['500', '600', '700'], display: 'swap', variable: '--rx-font-display' })
export const rxSans = Figtree({ subsets: ['latin'], display: 'swap', variable: '--rx-font-sans' })

/** Font variables for the store wrapper and for portals rendered outside it. */
export const rxFontClass = `${rxDisplay.variable} ${rxSans.variable}`
