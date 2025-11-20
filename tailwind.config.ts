const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'var(--font-montserrat)', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      colors: {
        // BLUELOCK inspired color palette (Light theme)
        bluelock: {
          // Light theme backgrounds (white/gray)
          light: '#ffffff', // Pure white background
          'light-2': '#f8f9fa', // Light gray for cards/sections
          'light-3': '#e9ecef', // Medium gray for hover states
          // Blue shades (for text - primary color)
          dark: '#2563eb', // Primary blue text color
          'dark-2': '#1e40af', // Darker blue for headings
          'dark-3': '#1e3a8a', // Darkest blue for emphasis
          // Medium blue (borders, dividers)
          blue: '#3b82f6', // Border color (blue)
          'blue-light': '#60a5fa', // Hover border
          'blue-lighter': '#93c5fd', // Active border
          // Bright green accent (for buttons and highlights)
          green: '#00ff88', // Primary accent button
          'green-bright': '#00ffaa', // Bright accent hover
          'green-dark': '#00cc6a', // Darker accent
          // Gradient colors
          purple: '#6b46c1',
          pink: '#ec4899',
          // Text colors for light theme
          'text-primary': '#2563eb', // Blue text
          'text-secondary': '#3b82f6', // Medium blue text
          'text-muted': '#64748b', // Muted gray-blue text
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      backgroundImage: {
        'bluelock-gradient': 'linear-gradient(135deg, #0a1628 0%, #15284d 25%, #1e3a5f 50%, #6b46c1 75%, #ec4899 100%)',
        'bluelock-gradient-vertical': 'linear-gradient(180deg, #0a1628 0%, #0f1f3a 50%, #15284d 100%)',
        'bluelock-accent': 'linear-gradient(135deg, #00ff88 0%, #00ffaa 100%)',
      },
      boxShadow: {
        'bluelock-glow': '0 0 20px rgba(0, 255, 136, 0.3)',
        'bluelock-glow-lg': '0 0 40px rgba(0, 255, 136, 0.5)',
      },
    },
  },
  plugins: [],
}
export default config

