module.exports = {
  content: ["./src/**/*.{njk,html,js}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        konomi: {
          bg: '#1a1a2e',
          surface: '#16213e',
          primary: '#0f3460',
          accent: '#e94560',
          text: '#eaeaea',
          muted: '#8892b0'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      }
    }
  },
  plugins: []
};
