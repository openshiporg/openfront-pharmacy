import { Schibsted_Grotesk } from 'next/font/google'

// One heavy grotesk, as printed on blister foil; figures use its tabular numerals.
export const rxSans = Schibsted_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--rx-font-sans' })

/** Font variables for the store wrapper and for portals rendered outside it. */
export const rxFontClass = rxSans.variable
