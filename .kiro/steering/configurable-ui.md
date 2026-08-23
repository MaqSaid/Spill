# Configurable UI Architecture

## Principle: Zero Hardcoded Content
All user-facing text, navigation, banners, alerts, and paths MUST be configurable.
Components receive content as props from a centralized config — never embed strings directly.

## Configuration Structure

### App Config (`frontend/src/config/app-config.ts`)
Single source of truth for all configurable UI elements:

```typescript
export interface AppConfig {
  branding: BrandingConfig;
  employee: PortalConfig;
  admin: PortalConfig;
  privacy: PrivacyConfig;
  alerts: AlertConfig[];
}

interface BrandingConfig {
  appName: string;
  tagline: string;
  logoUrl?: string;
  primaryColor: string;
  supportEmail?: string;
}

interface PortalConfig {
  basePath: string;           // "/", "/admin"
  routes: RouteConfig[];
  navItems: NavItem[];
  footer: FooterConfig;
  banners: BannerConfig[];
}

interface RouteConfig {
  path: string;
  label: string;
  component: string;
  showInNav: boolean;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
}

interface BannerConfig {
  id: string;
  title: string;
  content: string;
  variant: "green" | "blue" | "amber" | "gray";
  collapsible: boolean;
  defaultOpen: boolean;
}

interface FooterConfig {
  text: string;
  links: { label: string; path: string }[];
}

interface AlertConfig {
  id: string;
  message: string;
  type: "info" | "warning" | "error";
  dismissible: boolean;
}
```

## Role-Based Access (URL Separation)

### Employee Portal (/)
- NO admin options visible — employees don't know admin exists
- Routes: /, /status, /privacy, /help
- No login required (anonymous by design)
- Clean, simple, trust-focused UI

### Admin Portal (/admin)
- Requires MFA authentication at /admin (login gate)
- Routes: /admin, /admin/dashboard, /admin/settings
- Dashboard: submissions list, analytics, status management
- Settings: key upload, emergency lockdown, TOTP setup
- Separate nav bar, separate footer, admin-specific branding

### Separation Enforcement
- Employee components NEVER import admin components
- Admin components can share base UI elements (buttons, cards)
- React Router with nested routes per portal
- No "Admin" tab visible on employee paths

## Implementation Pattern

```tsx
// App.tsx
<BrowserRouter>
  <Routes>
    {/* Employee Portal */}
    <Route path="/" element={<EmployeeLayout config={appConfig.employee} />}>
      <Route index element={<SubmitPage />} />
      <Route path="status" element={<StatusPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="help" element={<HelpPage />} />
    </Route>

    {/* Admin Portal (separate layout, MFA gate) */}
    <Route path="/admin" element={<AdminLayout config={appConfig.admin} />}>
      <Route index element={<AdminLoginPage />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="settings" element={<AdminSettings />} />
    </Route>
  </Routes>
</BrowserRouter>
```

## Rules
- NO hardcoded menu labels, banner text, or URLs in components
- All text comes from config or i18n keys
- Components are pure — they receive display data as props
- Layout components read from config to render navigation, footer, banners
- To change branding/menus: edit config file, no component changes needed
- Config can be loaded from: static file (build-time) or API (runtime)
