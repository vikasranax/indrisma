/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#f5f6f8',
        sub: '#9aa1ac',
        muted: '#5a6270',
        faint: '#343a44',
        accent: '#f2b84b',
        'accent-ink': '#241704',
        canvas: '#07080a',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'ui-sans-serif', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 36px -6px rgba(242, 184, 75, 0.35)',
        dock: '0 14px 40px -14px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};