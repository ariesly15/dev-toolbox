import i18n from "@/i18n";

export interface Theme {
  id: string;
  name: string;
  accent: string;
}

export const THEMES: Theme[] = [
  { id: 'sunshine', name: i18n.theme.sunshine, accent: '#ffe60f' },
  { id: 'indigo', name: i18n.theme.indigo, accent: '#4f6bf0' },
];

export const DEFAULT_THEME_ID = THEMES[0].id;
const THEME_KEY = 'dev-toolbox:theme';

export function loadThemeId(): string {
  const saved = localStorage.getItem(THEME_KEY);
  return THEMES.some((t) => t.id === saved) ? (saved as string) : DEFAULT_THEME_ID;
}

export function saveThemeId(id: string): void {
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    /* storage unavailable — theme stays for this session */
  }
}
