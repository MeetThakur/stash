import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, TYPOGRAPHY, SPACING } from '../styles/theme';

interface EmptyStateProps {
  message?: string;
}

import { Inbox } from 'lucide-react-native';

export function EmptyState({ message = 'Share a link to start your stash.' }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={[styles.graphicContainer, { backgroundColor: colors.surfaceRaised }]}>
        <Inbox size={32} color={colors.textSecondary} />
      </View>
      <Text style={[styles.messageText, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: 64,
  },
  graphicContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    opacity: 0.8,
  },
  messageText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
