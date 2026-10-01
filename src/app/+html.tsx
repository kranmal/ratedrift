import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Wraps every statically rendered route. This runs in Node during `expo export`,
 * so nothing in here can touch the DOM.
 *
 * Per-route title, description and canonical live in `SeoHead` instead — the
 * static export emits a helmet-managed <title> ahead of anything declared here.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Disables body scrolling on web, so <ScrollView> components scroll instead. */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: rootStyle }} />
        {/* Applies the saved or system theme before first paint, so there is no light flash in dark mode. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const rootStyle = `
html, body { height: 100%; }
#root { display: flex; height: 100%; flex: 1; }
html { background-color: #ffffff; color-scheme: light; }
html[data-theme="dark"] { background-color: #000000; color-scheme: dark; }
`;

// Keep the key in step with STORAGE_KEY in use-theme-override.tsx.
const themeScript = `
try {
  var t = localStorage.getItem('ratedrift-theme-override');
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;
