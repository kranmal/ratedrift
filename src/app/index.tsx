import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SeoHead } from '@/components/seo-head';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UnlockModal } from '@/components/unlock-modal';
import { Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { buildIcs } from '@/lib/ics';
import { formatPence, getDeadlines, netAtRiskPence, netDeadlineAtRiskPence } from '@/lib/interest';
import { usePro } from '@/lib/pro';
import { seedDemoAccounts, useStore } from '@/lib/store';

export default function HomeScreen() {
  const router = useRouter();
  const now = useNow();
  const store = useStore();
  const { hasPro } = usePro();
  const [unlocking, setUnlocking] = useState(false);

  const deadlines = getDeadlines(store.accounts, now);
  const atRisk = netAtRiskPence(store.accounts, store.tax);
  const upcomingIcs = buildIcs(store.accounts, now);
  const lapsed = deadlines.filter((d) => d.daysAway < 0).length;

  return (
    <>
      <SeoHead
        title="RateDrift — catch savings bonuses and fixed bonds before they expire"
        description="Track when your savings bonus rates end and fixed bonds mature, see what doing nothing costs you per year, and check your FSCS cover. No sign-up, and your savings data never leaves your device."
      />
      <Screen
        title="RateDrift"
        subtitle={
          !store.loaded
            ? ' '
            : store.accounts.length === 0
            ? 'Nothing tracked yet.'
            : `${store.accounts.length} account${store.accounts.length === 1 ? '' : 's'}${lapsed ? ` · ${lapsed} already lapsed` : ''}`
        }>
        {!store.loaded ? null : store.accounts.length === 0 ? (
          <>
            <EmptyState message="Add the savings accounts you hold and RateDrift will tell you what each one costs you if you let it drift." />
            <PrimaryButton label="Add your first account" onPress={() => router.push('/accounts')} />
            <PrimaryButton label="Load demo accounts" variant="secondary" onPress={seedDemoAccounts} />
            <ThemedView type="backgroundElement" style={styles.how}>
              <ThemedText type="smallBold">How it works</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                1. Type in your savings accounts, including when any bonus rate ends or fixed bond matures.
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                2. See what letting each one drift costs you per year, and which deadline is next.
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                3. Check which accounts share an FSCS banking licence, and add the deadlines to your calendar with reminders.
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                No sign-up, no bank connection. Your savings data stays on your device. RateDrift tracks what you already hold; it does not recommend products.
              </ThemedText>
            </ThemedView>
          </>
        ) : (
          <>
            <ThemedView type="backgroundElement" style={styles.hero}>
              <ThemedText type="small" themeColor="textSecondary">
                At risk if you do nothing
              </ThemedText>
              <ThemedText style={styles.heroFigure}>{formatPence(atRisk)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                per year in lost interest, after estimated tax
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
                    <ThemedText type="smallBold">{formatPence(netDeadlineAtRiskPence(store.accounts, store.tax, deadline))}/yr</ThemedText>
                  </ThemedView>
                );
              })}
            </View>

            {Platform.OS === 'web' && upcomingIcs ? (
              <>
                <PrimaryButton
                  label={hasPro ? 'Add deadlines to my calendar (.ics)' : 'Unlock calendar reminders'}
                  variant="secondary"
                  onPress={() => (hasPro ? downloadIcs(upcomingIcs) : setUnlocking(true))}
                />
                <UnlockModal
                  visible={unlocking}
                  onClose={() => setUnlocking(false)}
                  onUnlocked={() => {
                    setUnlocking(false);
                    downloadIcs(upcomingIcs);
                  }}
                />
              </>
            ) : null}

            <ThemedText type="small" themeColor="textSecondary">
              Maturity figures assume a matured fixed bond rolls into 1.5%, which is an assumption,
              not a quoted rate. Costs are after estimated tax, using the tax band you pick on the Accounts tab and the Personal Savings Allowance only.
            </ThemedText>
          </>
        )}
      </Screen>
    </>
  );
}

/** Saves the calendar file in the browser. Native has no download path, so the button is web-only. */
function downloadIcs(content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ratedrift-deadlines.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  how: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
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
