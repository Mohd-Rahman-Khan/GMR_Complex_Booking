import React from 'react';

import { View, TouchableOpacity, StyleSheet } from 'react-native';

import AppText from './AppText';

import { Colors } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  actionText?: string;
}

const SectionHeader: React.FC<Props> = ({
  title,
  subtitle,
  onPress,
  actionText = 'See All',
}) => {
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <AppText variant="h3">{title}</AppText>

        {!!subtitle && (
          <AppText
            variant="caption"
            color={Colors.secondary}
            style={styles.subtitle}
          >
            {subtitle}
          </AppText>
        )}
      </View>

      {!!onPress && (
        <TouchableOpacity onPress={onPress}>
          <AppText color={Colors.accentDark} variant="bodyMedium">
            {actionText} →
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  subtitle: {
    marginTop: 5,
  },
});

export default SectionHeader;
