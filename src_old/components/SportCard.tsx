import React from 'react';

import { TouchableOpacity, Image, View, StyleSheet } from 'react-native';

import AppText from './AppText';

import { Sport } from '../types';
import { Colors, Spacing } from '../theme';

interface Props {
  item: Sport;
  onPress: () => void;
}

const SportCard: React.FC<Props> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.overlay} />

      <View style={styles.content}>
        <AppText style={styles.icon}>{item.icon}</AppText>

        <AppText color={Colors.white} variant="bodyMedium">
          {item.name}
        </AppText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 135,
    height: 125,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: Colors.primary,
  },

  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },

  icon: {
    fontSize: 27,
    marginBottom: 5,
  },
});

export default SportCard;
