import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import {
  SITE as SITE_DEFAULT,
  NAV_ITEMS as NAV_DEFAULT,
  HERO as HERO_DEFAULT,
  STATS as STATS_DEFAULT,
  PROGRAMS as PROGRAMS_DEFAULT,
  WHY_ITEMS as WHY_DEFAULT,
  FOOTER as FOOTER_DEFAULT,
} from '../config/site';

const DEFAULTS = {
  SITE: SITE_DEFAULT,
  NAV_ITEMS: NAV_DEFAULT,
  HERO: HERO_DEFAULT,
  STATS: STATS_DEFAULT,
  PROGRAMS: PROGRAMS_DEFAULT,
  WHY_ITEMS: WHY_DEFAULT,
  FOOTER: FOOTER_DEFAULT,
};

// Merge: object → gộp từng field; array/primitive → thay thế hoàn toàn nếu có override
function mergeSection(def, override) {
  if (override === undefined || override === null) return def;
  if (Array.isArray(def) || Array.isArray(override)) return override;
  if (typeof def === 'object' && typeof override === 'object') return { ...def, ...override };
  return override;
}

const SiteConfigContext = createContext(DEFAULTS);

export function SiteConfigProvider({ children }) {
  const { data } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/site-settings').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const merged = {};
  for (const key of Object.keys(DEFAULTS)) {
    merged[key] = mergeSection(DEFAULTS[key], data?.[key]);
  }

  return (
    <SiteConfigContext.Provider value={merged}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export const useSiteConfig = () => useContext(SiteConfigContext);
