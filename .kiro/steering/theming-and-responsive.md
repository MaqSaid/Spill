# Theming, Branding & Mobile Responsiveness

## CSS Architecture

### CSS Custom Properties (Variables)
All colors MUST be defined as CSS custom properties in `:root` for theming:
```css
:root {
  --color-primary: 79 70 229;      /* Indigo-600 RGB */
  --color-primary-light: 99 102 241;
  --color-primary-dark: 67 56 202;
  --color-accent: 16 185 129;      /* Emerald-500 */
  --color-background: 249 250 251; /* Gray-50 */
  --color-surface: 255 255 255;    /* White */
  --color-text: 17 24 39;          /* Gray-900 */
  --color-text-muted: 107 114 128; /* Gray-500 */
}
```

### Tailwind Integration
- Use `tailwind.config.js` `theme.extend.colors` to reference CSS variables
- This allows runtime theme switching without rebuild
- Dark mode via `prefers-color-scheme` media query (already configured)

### Theme Switching (Future)
- Themes defined as CSS variable overrides
- Corporate clients can override `:root` variables for branding
- No hardcoded color values in components — always use theme tokens

## Mobile Responsiveness

### Breakpoints (Tailwind defaults)
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Mobile-First Rules
- All layouts MUST be designed mobile-first (base styles = mobile)
- Use `sm:`, `md:`, `lg:` prefixes for larger screens
- Navigation: stack vertically on mobile, horizontal on desktop
- Forms: full-width inputs on mobile
- Cards: full-width on mobile, max-width on desktop
- Touch targets: minimum 44x44px (WCAG 2.5.5)
- Font sizes: minimum 16px for inputs (prevents iOS zoom)

### Viewport Configuration
- `<meta name="viewport" content="width=device-width, initial-scale=1">` MUST be in index.html
- No `user-scalable=no` — users must be able to zoom (accessibility)
- No `maximum-scale` restriction

### Navigation on Mobile
- Tabs should scroll horizontally or wrap
- Active tab clearly visible
- Touch-friendly spacing between tab buttons

### Optimized CSS
- Tailwind CSS with purge/content config removes unused styles
- No duplicate utility classes
- Use `@apply` sparingly (prefer utility classes in JSX)
- Minimize custom CSS — leverage Tailwind's design system

## Branding Requirements
- "Zero-knowledge anonymous feedback" tagline: bold, prominent, uses primary color
- App name "Spill" uses primary-dark for contrast
- Logo area reserved (currently text-only, configurable in future)
- Footer repeats tagline for reinforcement
- All branded text uses CSS variables for theming
