interface ThemeToggleProps {
  theme: 'light' | 'dark'
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const dark = theme === 'dark'
  return (
    <button
      onClick={onToggle}
      className="theme-toggle"
      type="button"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
    >
      <span className="theme-knob" aria-hidden="true">
        {dark ? '☾' : '☀'}
      </span>
      <span className="theme-text">{dark ? 'Dark' : 'Light'}</span>
    </button>
  )
}
