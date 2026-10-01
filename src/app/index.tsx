import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SeoHead } from '@/components/seo-head';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { formatPence, getDeadlines, totalAtRiskPence } from '@/lib/interest';
import { seedDemoAccounts, useStore } from '@/lib/store';

export default function HomeScreen() {
  const now = useNow();
  const store = useStore();

  const deadlines = getDeadlines(store.accounts, now);
  const atRisk = totalAtRiskPence(store.accounts);
  const lapsed = deadlines.filter((d) => d.daysAway < 0).length;

  return (
    <>
      <SeoHead
        title="RateDrift — catch savings bonuses and fixed bonds before they expire"
        description="Track when your savings bonus rates end and fixed bonds mature, see what doing nothing costs you per year, and check your FSCS cover. Free, no sign-up, nothing leaves your device."
      />
      <Screen
        title="RateDrift"
        subtitle={
          store.accounts.length === 0
            ? 'Nothing tracked yet.'
            : `${store.accounts.length} account${store.accounts.length === 1 ? '' : 's'}${lapsed ? ` · ${lapsed} already lapsed` : ''}`
        }>
        {store.accounts.length === 0 ? (
          <>
            <EmptyState message="Add the savings accounts you hold and RateDrift will tell you what each one costs you if you let it drift." />
            <PrimaryButton label="Load demo accounts" onPress={seedDemoAccounts} />
          </>
        ) : (
          <>
            <ThemedView type="backgroundElement" style={styles.hero}>
              <ThemedText type="small" themeColor="textSecondary">
                At risk if you do nothing
              </ThemedText>
              <ThemedText style={styles.heroFigure}>{formatPence(atRisk)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                per year, in lost interest
              </ThemedText>
            </ThemedView>

            <View style={styles.list}>
              {deadlines.map((deadline) => {
                const account = store.accounts.find((a) => a.id === deadline.accountId);
                if (!account) return null;
                return (
                  <ThemedView
                    key={`${deadline.accountId}-${deadline.kind}`}
                    type="backgroundElement"
                    style={styles.row}>
                    <View style={styles.rowText}>
                      <ThemedText type="smallBold">
                        {account.provider}
                        {account.product ? ` · ${account.product}` : ''}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {deadline.kind === 'bonus-ends' ? 'Bonus ends' : 'Matures'} {deadline.on} ·{' '}
                        {describeDays(deadline.daysAway)}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold">{formatPence(deadline.atRiskPence)}/yr</ThemedText>
                  </ThemedView>
                );
              })}
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              Maturity figures assume a matured fixed bond rolls into 1.5%, which is an assumption,
              not a quoted rate. Tax is estimated from the Personal Savings Allowance only.
            </ThemedText>
          </>
        )}
      </Screen>
    </>
  );
}

function describeDays(days: number): string {
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

const styles = StyleSheet.create({
  hero: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.one,
    alignItems: 'center',
  },
  heroFigure: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '700',
  },
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowText: { flex: 1, gap: Spacing.one },
});
