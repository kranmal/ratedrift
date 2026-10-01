import { useState } from 'react';
import { Linking } from 'react-native';

import { FormInput } from './form-input';
import { PrimaryButton } from './primary-button';
import { SheetModal } from './sheet-modal';
import { ThemedText } from './themed-text';

import { activate, checkoutUrl } from '@/lib/pro';

type UnlockModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Called once a key has been accepted. */
  onUnlocked: () => void;
};

export function UnlockModal({ visible, onClose, onUnlocked }: UnlockModalProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await activate(key);
    setBusy(false);
    if (result.ok) {
      setKey('');
      onUnlocked();
    } else {
      setError(result.message);
    }
  }

  return (
    <SheetModal visible={visible} onClose={onClose} title="Unlock calendar reminders">
      <ThemedText type="small" themeColor="textSecondary">
        Export your bonus and maturity dates to any calendar app, with reminders 30 and 7 days ahead.
        One payment, no subscription.
      </ThemedText>
      <PrimaryButton label="Get a licence key" onPress={() => Linking.openURL(checkoutUrl)} />
      <FormInput
        label="Already have a key?"
        value={key}
        onChangeText={setKey}
        placeholder="Paste your licence key"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error ? <ThemedText type="small">{error}</ThemedText> : null}
      <PrimaryButton label={busy ? 'Checking…' : 'Activate'} variant="secondary" disabled={busy} onPress={submit} />
      <ThemedText type="small" themeColor="textSecondary">
        Activating sends your key to Lemon Squeezy, our payment provider, to confirm it. Your savings
        data never leaves your device.
      </ThemedText>
    </SheetModal>
  );
}
