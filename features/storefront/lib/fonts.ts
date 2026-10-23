import { DM_Mono, Public_Sans } from 'next/font/google'

export const rxSans = Public_Sans({ subsets: ['latin'], display: 'swap', variable: '--rx-font-sans' })

export const rxMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap', variable: '--rx-font-mono' })

/** Font variables for the store wrapper and for portals rendered outside it. */
export const rxFontClass = `${rxSans.variable} ${rxMono.variable}`
