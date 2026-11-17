import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
}

const ScreenWrapper: React.FC<Props> = ({ children, style }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
});

export default ScreenWrapper;
