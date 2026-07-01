import { useEffect } from 'react';
import { COLORS, TYPOGRAPHY } from './site';

/** Inject CSS custom properties from site.js into :root at runtime */
export default function useSiteTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary',      COLORS.primary);
    root.style.setProperty('--color-primary-hover', COLORS.primaryHover);
    root.style.setProperty('--color-accent',        COLORS.accent);
    root.style.setProperty('--color-accent-hover',  COLORS.accentHover);
    root.style.setProperty('--color-background',    COLORS.background);
    root.style.setProperty('--color-surface',       COLORS.surface);
    root.style.setProperty('--color-foreground',    COLORS.foreground);
    root.style.setProperty('--color-muted-text',    COLORS.mutedText);
    root.style.setProperty('--color-border',        COLORS.border);
    root.style.setProperty('--color-success',       COLORS.success);
    root.style.setProperty('--color-warning',       COLORS.warning);
    root.style.setProperty('--color-destructive',   COLORS.destructive);
    root.style.setProperty('--color-utility-bg',    COLORS.utilityBg);
    root.style.setProperty('--color-stats-bg',      COLORS.statsBg);
    root.style.setProperty('--color-cta-bg',        COLORS.ctaBg);
    root.style.setProperty('--font-heading', `'${TYPOGRAPHY.fontHeading}', Georgia, serif`);
    root.style.setProperty('--font-body',    `'${TYPOGRAPHY.fontBody}', system-ui, sans-serif`);
  }, []);
}
