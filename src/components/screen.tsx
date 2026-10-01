import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggleButton } from './theme-toggle-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** The common page chrome: header, scroll body, web-only ad slot and privacy link. */
export function Screen({ title, subtitle, children }: Props) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.contentWeb]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="title" style={styles.title}>
                {title}
              </ThemedText>
              {subtitle ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {subtitle}
                </ThemedText>
              ) : null}
            </View>
            <ThemeToggleButton />
          </View>

          {children}

          {Platform.OS === 'web' && (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.footer}
              onPress={() => Linking.openURL('https://kranmal.github.io/privacy.html')}>
              Privacy Policy
            </ThemedText>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
    width: '100%',
    alignSelf: 'center',
  },
  contentWeb: {
    maxWidth: MaxContentWidth,
    // The tab bar is absolutely positioned over the page, so clear its height with room to spare.
    paddingTop: Spacing.six + Spacing.five,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerText: { flex: 1, gap: Spacing.one },
  title: { fontSize: 36, lineHeight: 40 },
  footer: { textAlign: 'center', textDecorationLine: 'underline' },
});
