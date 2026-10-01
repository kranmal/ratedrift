import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useThemeOverride } from '@/hooks/use-theme-override';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  // The static web export prerenders in Node, where there is no media query to
  // read, so the first client render must match the server's 'light' output and
  // only then flip to the real scheme. That is exactly a hydration flag, which
  // is the one legitimate reason to set state in an effect body.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, []);

  const { override } = useThemeOverride();
  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return override ?? colorScheme;
  }

  return override ?? 'light';
}
