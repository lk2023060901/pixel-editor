import { EN_MESSAGES, type I18nMessageKey, ZH_CN_MESSAGES } from "./messages";

export { EN_MESSAGES, type I18nMessageKey, ZH_CN_MESSAGES } from "./messages";

export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type TranslationValues = Record<
  string,
  string | number | boolean | null | undefined
>;

export type TranslationFn = (
  key: I18nMessageKey,
  values?: TranslationValues
) => string;

export type I18nMessages = Record<I18nMessageKey, string>;

function formatMessage(
  template: string,
  values?: TranslationValues
): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = values[name];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function getMessages(locale: SupportedLocale): I18nMessages {
  return locale === "zh-CN" ? ZH_CN_MESSAGES : EN_MESSAGES;
}

export function resolveLocale(input?: string | null): SupportedLocale {
  if (!input) {
    return "en";
  }

  const normalized = input.toLowerCase();

  if (normalized === "zh" || normalized.startsWith("zh-")) {
    return "zh-CN";
  }

  const firstToken = normalized.split(",")[0]?.trim();

  if (firstToken === "zh" || firstToken?.startsWith("zh-")) {
    return "zh-CN";
  }

  return "en";
}

export function createTranslator(
  locale: SupportedLocale,
  messages: I18nMessages = getMessages(locale)
): TranslationFn {
  return (key, values) => {
    const template = messages[key] ?? EN_MESSAGES[key];
    return formatMessage(template, values);
  };
}
