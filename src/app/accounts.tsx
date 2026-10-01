import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { SeoHead } from '@/components/seo-head';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  annualInterestPence,
  atRiskPence,
  formatPence,
  rateAfterDrift,
  taxBreakdown,
  totalAnnualInterestPence,
} from '@/lib/interest';
import { useStore } from '@/lib/store';

const KIND_LABEL: Record<string, string> = {
  'easy-access': 'Easy access',
  fixed: 'Fixed term',
  notice: 'Notice',
  'cash-isa': 'Cash ISA',
  'regular-saver': 'Regular saver',
};

export default function AccountsScreen() {
  const store = useStore();
  const gross = totalAnnualInterestPence(store.accounts);
  const tax = taxBreakdown(store.accounts, store.tax);

  return (
    <>
      <SeoHead
        title="Accounts — RateDrift"
        description="Every savings account you hold, its current rate, and the rate it drops to if you let it drift."
        path="accounts"
      />
      <Screen title="Accounts" subtitle={`${formatPence(gross)}/yr gross · ${formatPence(tax.netPence)}/yr after estimated tax`}>
        {store.accounts.length === 0 ? (
          <EmptyState message="No accounts yet. Load the demo set from the home tab to see how this works." />
        ) : (
          <View style={styles.list}>
            {store.accounts.map((account) => {
              const after = rateAfterDrift(account);
              const drifts = after < account.aer;
              return (
                <ThemedView key={account.id} type="backgroundElement" style={styles.card}>
                  <View style={styles.cardHeader}>
                    <ThemedText type="smallBold">
                      {account.provider}
                      {account.product ? ` · ${account.product}` : ''}
                    </ThemedText>
                    <ThemedText type="smallBold">{formatPence(account.balancePence)}</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {KIND_LABEL[account.kind] ?? account.kind} · {account.aer}% AER ·{' '}
                    {formatPence(annualInterestPence(account.balancePence, account.aer))}/yr
                  </ThemedText>
                  {drifts ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      Drops to {after}% → losing {formatPence(atRiskPence(account))}/yr
                    </ThemedText>
                  ) : null}
                </ThemedView>
              );
            })}
          </View>
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
});
