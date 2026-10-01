import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AccountFormModal } from '@/components/account-form-modal';
import { ChipRow } from '@/components/chip-row';
import { PrimaryButton } from '@/components/primary-button';

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
import { removeAccount, setTaxProfile, useStore } from '@/lib/store';
import type { Account, TaxBand } from '@/types/models';

const KIND_LABEL: Record<string, string> = {
  'easy-access': 'Easy access',
  fixed: 'Fixed term',
  notice: 'Notice',
  'cash-isa': 'Cash ISA',
  'regular-saver': 'Regular saver',
};

const BANDS: { value: TaxBand; label: string }[] = [
  { value: 'none', label: 'Non-taxpayer' },
  { value: 'basic', label: 'Basic 20%' },
  { value: 'higher', label: 'Higher 40%' },
  { value: 'additional', label: 'Additional 45%' },
];

export default function AccountsScreen() {
  const store = useStore();
  const [editing, setEditing] = useState<Account | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | undefined>();

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
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
        <PrimaryButton label="Add account" onPress={openAdd} />
        {!store.loaded ? null : store.accounts.length === 0 ? (
          <EmptyState message="No accounts yet. Add one above, or load the demo set from the home tab to see how this works." />
        ) : (
          <View style={styles.list}>
            {store.accounts.map((account) => {
              const after = rateAfterDrift(account);
              const drifts = after < account.aer;
              return (
                <ThemedView key={account.id} type="backgroundElement" style={styles.card}>
                  <Pressable
                    onPress={() => {
                      setEditing(account);
                      setFormOpen(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${account.provider}`}
                    style={styles.cardBody}>
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
                  </Pressable>
                  {confirmId === account.id ? (
                    <View style={styles.confirmRow}>
                      <PrimaryButton label="Delete" variant="danger" onPress={() => { removeAccount(account.id); setConfirmId(undefined); }} />
                      <PrimaryButton label="Keep" variant="secondary" onPress={() => setConfirmId(undefined)} />
                    </View>
                  ) : (
                    <Pressable onPress={() => setConfirmId(account.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Delete ${account.provider}`}>
                      <ThemedText type="small" themeColor="textSecondary">Remove</ThemedText>
                    </Pressable>
                  )}
                </ThemedView>
              );
            })}
          </View>
        )}

        <ChipRow
          label="Your tax band (for the after-tax estimate)"
          options={BANDS}
          value={store.tax.band}
          onChange={(band) => setTaxProfile({ ...store.tax, band })}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Estimate only: uses the Personal Savings Allowance and ignores the starting rate for savings.
        </ThemedText>
      </Screen>
      <AccountFormModal visible={formOpen} account={editing} onClose={() => setFormOpen(false)} />
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
  cardBody: { gap: Spacing.one },
  confirmRow: { flexDirection: 'row', gap: Spacing.two },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
