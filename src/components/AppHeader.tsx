import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import AppText from './AppText';
import { Colors, Spacing } from '../theme';

interface Props {
  title: string;
  showBack?: boolean;
}

const AppHeader: React.FC<Props> = ({ title, showBack = false }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AppText variant="h2">‹</AppText>
        </TouchableOpacity>
      ) : null}

      <AppText variant="h3">{title}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppHeader;
