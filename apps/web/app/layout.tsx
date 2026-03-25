import type { Metadata } from "next";
import { headers } from "next/headers";

import { getMessages, resolveLocale, createTranslator } from "@pixel-editor/i18n";
import { I18nProvider } from "@pixel-editor/i18n/client";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get("accept-language"));
  const t = createTranslator(locale, getMessages(locale));

  return {
    title: t("meta.title"),
    description: t("meta.description")
  };
}

export default async function RootLayout(
  props: Readonly<{ children: React.ReactNode }>
) {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get("accept-language"));
  const messages = getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          {props.children}
        </I18nProvider>
      </body>
    </html>
  );
}
