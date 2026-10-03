/**
 * Langues supportées par le site Open Numeric.
 */
export const SUPPORTED_LOCALES = ['fr', 'en', 'de', 'zh', 'es'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}