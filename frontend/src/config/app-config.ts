/**
 * App Configuration — Single source of truth for all UI content.
 * To customize branding, menus, or text: edit this file only.
 * No component changes needed.
 */

export interface BannerConfig {
  id: string;
  title: string;
  content: string;
  variant: "green" | "blue" | "amber" | "gray";
  collapsible: boolean;
  defaultOpen: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
}

export interface FooterConfig {
  text: string;
  links: { label: string; path: string }[];
}

export const appConfig = {
  branding: {
    appName: "Spill",
    tagline: "Zero-knowledge anonymous feedback",
    logoUrl: undefined as string | undefined,
    supportEmail: "privacy@company.com",
  },

  employee: {
    basePath: "/",
    navItems: [
      { id: "submit", label: "Submit Feedback", path: "/" },
      { id: "status", label: "My Status", path: "/status" },
      { id: "privacy", label: "Privacy", path: "/privacy" },
      { id: "help", label: "How It Works", path: "/help" },
    ] as NavItem[],
    banners: [
      {
        id: "employment-protection",
        title: "Your Employment is Protected",
        content: "You will NOT be disciplined, penalised, or removed from employment for providing honest feedback. This platform makes identification technically impossible — not just by policy, but by design. Australian workplace law protects employees who raise concerns in good faith.",
        variant: "green",
        collapsible: true,
        defaultOpen: true,
      },
      {
        id: "confidentiality",
        title: "100% Confidential — Cryptographically Guaranteed",
        content: "Your feedback is encrypted in your browser before being sent — the server cannot read it. No IP address, name, email, or browser information is stored. Your employer cannot identify who submitted this feedback.",
        variant: "blue",
        collapsible: true,
        defaultOpen: true,
      },
      {
        id: "how-it-works",
        title: "How does this work? — Learn about our encryption",
        content: "Step 1: You type your feedback. Step 2: Your browser encrypts it with military-grade AES-256 encryption before sending. Step 3: The server stores only encrypted data it cannot decrypt. Step 4: Only your HR manager with the decryption key can read it — without knowing who wrote it. No cookies. No login. No tracking.",
        variant: "gray",
        collapsible: true,
        defaultOpen: false,
      },
    ] as BannerConfig[],
    footer: {
      text: "Zero-knowledge anonymous feedback platform — Your privacy is mathematically guaranteed",
      links: [
        { label: "Privacy Policy", path: "/privacy" },
        { label: "How It Works", path: "/help" },
      ],
    } as FooterConfig,
  },

  admin: {
    basePath: "/admin",
    navItems: [
      { id: "dashboard", label: "Dashboard", path: "/admin" },
      { id: "analytics", label: "Analytics", path: "/admin/analytics" },
      { id: "settings", label: "Settings", path: "/admin/settings" },
    ] as NavItem[],
    footer: {
      text: "Spill Admin Portal — Manage anonymous feedback securely",
      links: [] as { label: string; path: string }[],
    } as FooterConfig,
  },

  alerts: {
    submissionFinal: "Submissions are final. Cannot be edited. You may withdraw within 24 hours via \"My Status\" — but only while this browser tab remains open. Closing the tab ends your session permanently.",
  },
};
