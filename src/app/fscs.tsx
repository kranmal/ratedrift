import { Linking, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { SeoHead } from '@/components/seo-head';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { FSCS_LIMIT_PENCE, VERIFIED_ON, getFscsExposure } from '@/lib/fscs';
import { formatPence } from '@/lib/interest';
import { useStore } from '@/lib/store';

const FSCS_CHECKER = 'https://www.fscs.org.uk/check/check-your-money-is-protected/';

export default function FscsScreen() {
  const store = useStore();
  const exposure = getFscsExposure(store.accounts);
  const breaches = exposure.filter((e) => e.unprotectedPence > 0);

  return (
    <>
      <SeoHead
        title="FSCS cover — RateDrift"
        description="FSCS protection is per banking licence, not per brand. See which of your savings sit under the same licence and how much is above the £85,000 limit."
        path="fscs"
      />
      <Screen
        title="FSCS cover"
        subtitle={`${formatPence(FSCS_LIMIT_PENCE)} per banking licence${breaches.length ? ` · ${breaches.length} over the limit` : ''}`}>
        {store.accounts.length === 0 ? (
          <EmptyState message="No accounts yet. Load the demo set from the home tab to see how this works." />
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Cover is per banking licence, not per brand — several high-street names share one.
              Money above the limit on a single licence is not protected.
            </ThemedText>

            <View style={styles.list}>
              {exposure.map((entry) => (
                <ThemedView key={entry.licenceGroupId} type="backgroundElement" style={styles.card}>
                  <View style={styles.cardHeader}>
                    <ThemedText type="smallBold">{entry.groupName}</ThemedText>
                    <ThemedText type="smallBold">{formatPence(entry.totalPence)}</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {entry.accountIds.length} account{entry.accountIds.length === 1 ? '' : 's'}
                  </ThemedText>
                  {entry.unprotectedPence > 0 ? (
                    <ThemedText type="smallBold">
                      ⚠ {formatPence(entry.unprotectedPence)} above the limit, unprotected
                    </ThemedText>
                  ) : null}
                  {entry.unlisted ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      Not in our list, so this is treated as its own licence. It may share one with
                      another bank you hold, so check it with the FSCS.
                    </ThemedText>
                  ) : null}
                  {entry.caution ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {entry.caution}
                    </ThemedText>
                  ) : null}
                </ThemedView>
              ))}
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              Brand-to-licence mapping last verified: {VERIFIED_ON}. Mappings change when banks are
              acquired, so confirm yours with the FSCS before relying on this.
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.link}
              onPress={() => Linking.openURL(FSCS_CHECKER)}>
              Check your money is protected — fscs.org.uk
            </ThemedText>
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  link: { textDecorationLine: 'underline' },
});
