import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Base — charcoal blacks, deep browns, dark grays */
        'mugen-black': '#22201f',
        'mugen-dark': '#2a2624',
        'mugen-gray': '#3e3636',
        /* Accents — crimson, magenta, soft gold */
        'mugen-crimson': '#863841',
        'mugen-magenta': '#b84d7a',
        'mugen-gold': '#c6a86c',
        /** Hover / rim light (replaces red glow on interaction) */
        'mugen-glow': '#FFD34D',
        'mugen-glow-deep': '#CAA400',
        'mugen-red': '#6b2d34',
        /* Mid-tones — parchment, muted purple */
        'mugen-parchment': '#e5dcc8',
        'mugen-purple': '#4d3e4f',
        'mugen-white': '#FFFFFF',
      },
      fontFamily: {
        'cinzel': ['var(--font-cinzel)', 'serif'],
        'noto-jp': ['var(--font-noto-jp)', 'sans-serif'],
        'sans': ['var(--font-dm-sans)', 'sans-serif'],
        'naruto': ['NinjaNaruto', 'sans-serif'],
      },
      backgroundImage: {
        'glass': 'rgba(255, 255, 255, 0.05)',
        'glass-strong': 'rgba(255, 255, 255, 0.1)',
      },
      backdropFilter: {
        'blur': 'blur(20px)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(134, 56, 65, 0.45)',
        'glow-lg': '0 0 40px rgba(134, 56, 65, 0.55)',
        'glow-strong': '0 0 60px rgba(134, 56, 65, 0.65)',
        'glow-gold': '0 0 20px rgba(255, 211, 77, 0.48)',
        'glow-gold-lg': '0 0 36px rgba(255, 211, 77, 0.55)',
        'glow-gold-soft': '0 0 24px rgba(202, 164, 0, 0.4)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'marquee': 'marquee 40s linear infinite',
        'marquee-reverse': 'marquee-reverse 40s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            'box-shadow': '0 0 20px rgba(134, 56, 65, 0.45)',
            'filter': 'drop-shadow(0 0 8px rgba(134, 56, 65, 0.35))',
          },
          '50%': {
            'box-shadow': '0 0 40px rgba(134, 56, 65, 0.65)',
            'filter': 'drop-shadow(0 0 16px rgba(184, 77, 122, 0.45))',
          },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'shimmer': {
          '0%': {
            'background-position': '-1000px 0',
          },
          '100%': {
            'background-position': '1000px 0',
          },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      perspective: {
        '1200': '1200px',
      },
      minHeight: {
        svh: '100svh',
        dvh: '100dvh',
      },
    },
  },
  plugins: [],
}

export default config
