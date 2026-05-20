/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'ui-monospace', 'monospace'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        muted: 'var(--color-muted)',
        'status-new': 'var(--color-status-new)',
        'status-assigned': 'var(--color-status-assigned)',
        'status-in-progress': 'var(--color-status-in-progress)',
        'status-closed': 'var(--color-status-closed)',
      },
    },
  },
  plugins: [],
}
