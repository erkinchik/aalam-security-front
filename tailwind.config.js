/**
 * Цвета заданы CSS-переменными в hex, а модификатор прозрачности Tailwind 3
 * (`bg-accent/20`) работает только с цветом-функцией. Без неё такие классы молча
 * не попадали в CSS: бейджи статусов, активный пункт меню и hover строк были без
 * фона. color-mix даёт ту же прозрачность прямо из переменной.
 */
const withAlpha =
  (variable) =>
  ({ opacityValue }) =>
    opacityValue === undefined
      ? `var(${variable})`
      : `color-mix(in srgb, var(${variable}) calc(${opacityValue} * 100%), transparent)`

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
        bg: withAlpha('--color-bg'),
        surface: withAlpha('--color-surface'),
        border: withAlpha('--color-border'),
        accent: withAlpha('--color-accent'),
        muted: withAlpha('--color-muted'),
        'status-new': withAlpha('--color-status-new'),
        'status-assigned': withAlpha('--color-status-assigned'),
        'status-in-progress': withAlpha('--color-status-in-progress'),
        'status-closed': withAlpha('--color-status-closed'),
      },
    },
  },
  plugins: [],
}
