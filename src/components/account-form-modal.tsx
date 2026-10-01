import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChipRow } from './chip-row';
import { FormInput } from './form-input';
import { PrimaryButton } from './primary-button';
import { SheetModal } from './sheet-modal';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { validateAccountForm, type AccountFormErrors, type AccountFormFields } from '@/lib/account-form';
import { findGroupByBrand } from '@/lib/fscs';
import { addAccount, updateAccount } from '@/lib/store';
import type { Account, AccountKind } from '@/types/models';

const KINDS: { value: AccountKind; label: string }[] = [
  { value: 'easy-access', label: 'Easy access' },
  { value: 'fixed', label: 'Fixed term' },
  { value: 'notice', label: 'Notice' },
  { value: 'cash-isa', label: 'Cash ISA' },
  { value: 'regular-saver', label: 'Regular saver' },
];

const EMPTY: AccountFormFields = {
  provider: '',
  product: '',
  kind: 'easy-access',
  balance: '',
  aer: '',
  postBonusAer: '',
  bonusEndsOn: '',
  maturesOn: '',
  noticeDays: '',
  notes: '',
};

function fromAccount(a: Account): AccountFormFields {
  return {
    provider: a.provider,
    product: a.product ?? '',
    kind: a.kind,
    balance: (a.balancePence / 100).toFixed(2),
    aer: String(a.aer),
    postBonusAer: a.postBonusAer === undefined ? '' : String(a.postBonusAer),
    bonusEndsOn: a.bonusEndsOn ?? '',
    maturesOn: a.maturesOn ?? '',
    noticeDays: a.noticeDays === undefined ? '' : String(a.noticeDays),
    notes: a.notes ?? '',
  };
}

interface Props {
  visible: boolean;
  /** Account being edited, or undefined to add a new one. */
  account?: Account;
  onClose: () => void;
}

export function AccountFormModal({ visible, account, onClose }: Props) {
  // Remount the body per open so state always starts from the right account.
  return (
    <SheetModal visible={visible} onClose={onClose} title={account ? 'Edit account' : 'Add account'}>
      {visible ? <FormBody key={account?.id ?? 'new'} account={account} onClose={onClose} /> : null}
    </SheetModal>
  );
}

function FormBody({ account, onClose }: { account?: Account; onClose: () => void }) {
  const [f, setF] = useState<AccountFormFields>(account ? fromAccount(account) : EMPTY);
  const [errors, setErrors] = useState<AccountFormErrors>({});

  const set = <K extends keyof AccountFormFields>(key: K, value: AccountFormFields[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const group = findGroupByBrand(f.provider);

  function save() {
    const result = validateAccountForm(f);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    const matched = findGroupByBrand(result.value.provider);
    const licenceGroupId = matched?.id ?? 'other';
    // Store the brand as the table spells it ("halifax" → "Halifax").
    const typed = result.value.provider.toLowerCase();
    const provider = matched?.brands.find((b) => b.toLowerCase() === typed) ?? result.value.provider;
    const value = { ...result.value, provider, licenceGroupId };
    if (account) updateAccount(account.id, value);
    else addAccount(value);
    onClose();
  }

  const err = (key: keyof AccountFormFields) =>
    errors[key] ? (
      <ThemedText type="small" style={styles.error}>
        {errors[key]}
      </ThemedText>
    ) : null;

  return (
    <>
      <View style={styles.field}>
        <FormInput label="Bank or building society" value={f.provider} onChangeText={(v) => set('provider', v)} placeholder="e.g. Halifax" autoCapitalize="words" />
        {err('provider')}
        {f.provider.trim() ? (
          <ThemedText type="small" themeColor="textSecondary">
            {group
              ? `FSCS licence: ${group.name}`
              : 'Not in our list — treated as its own licence. Check it with the FSCS.'}
          </ThemedText>
        ) : null}
      </View>

      <FormInput label="Product name (optional)" value={f.product} onChangeText={(v) => set('product', v)} placeholder="e.g. Online Saver" />

      <ChipRow label="Type" options={KINDS} value={f.kind} onChange={(v) => set('kind', v)} />

      <View style={styles.field}>
        <FormInput label="Balance (£)" value={f.balance} onChangeText={(v) => set('balance', v)} keyboardType="decimal-pad" placeholder="12,000" />
        {err('balance')}
      </View>

      <View style={styles.field}>
        <FormInput label="Current rate (% AER)" value={f.aer} onChangeText={(v) => set('aer', v)} keyboardType="decimal-pad" placeholder="4.75" />
        {err('aer')}
      </View>

      {f.kind === 'fixed' ? (
        <View style={styles.field}>
          <FormInput label="Matures on (yyyy-mm-dd)" value={f.maturesOn} onChangeText={(v) => set('maturesOn', v)} placeholder="2027-02-01" autoCapitalize="none" />
          {err('maturesOn')}
        </View>
      ) : null}

      {f.kind === 'notice' ? (
        <View style={styles.field}>
          <FormInput label="Notice period (days)" value={f.noticeDays} onChangeText={(v) => set('noticeDays', v)} keyboardType="number-pad" placeholder="95" />
          {err('noticeDays')}
        </View>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        Does the rate include a bonus that ends? Fill in both boxes. Leave both blank if not.
      </ThemedText>
      <View style={styles.field}>
        <FormInput label="Bonus ends on (yyyy-mm-dd)" value={f.bonusEndsOn} onChangeText={(v) => set('bonusEndsOn', v)} placeholder="2027-03-14" autoCapitalize="none" />
        {err('bonusEndsOn')}
      </View>
      <View style={styles.field}>
        <FormInput label="Rate after the bonus (% AER)" value={f.postBonusAer} onChangeText={(v) => set('postBonusAer', v)} keyboardType="decimal-pad" placeholder="1.5" />
        {err('postBonusAer')}
      </View>

      <FormInput label="Notes (optional)" value={f.notes} onChangeText={(v) => set('notes', v)} />

      <PrimaryButton label={account ? 'Save changes' : 'Add account'} onPress={save} />
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  error: { color: '#E5484D' },
});
