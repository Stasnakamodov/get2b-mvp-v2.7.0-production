/**
 * Переиспользуемые градиенты для всего приложения
 */
export const GRADIENTS = {
  // Primary gradients
  primary: "from-blue-500 to-blue-600",
  primaryHover: "from-blue-600 to-blue-700",

  // Hero section
  hero: "from-blue-400 via-purple-400 to-orange-400",
  heroOrbs: {
    top: "bg-blue-500/10",
    bottom: "bg-orange-500/10",
  },

  // Tutorial types
  cart: "from-blue-500 to-blue-600",
  globe: "from-purple-500 to-blue-500",
  globeHover: "from-purple-600 to-blue-600",
  camera: "from-pink-500 to-orange-500",
  catalog: "from-green-500 to-emerald-600",

  // Dashboard
  dashboard: "from-zinc-900/90 to-black/90",

  // Backgrounds
  section: "from-zinc-900 via-zinc-950 to-black",
  card: "from-zinc-900 to-black",
} as const

export type GradientKey = keyof typeof GRADIENTS
