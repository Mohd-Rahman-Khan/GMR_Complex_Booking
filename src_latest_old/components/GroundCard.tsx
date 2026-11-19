import React from 'react';

import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';

import AppText from './AppText';

import { Ground } from '../types';
import { Colors, Spacing } from '../theme';

interface Props {
  item: Ground;
  onPress: () => void;
}

const GroundCard: React.FC<Props> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      <View>
        <Image source={{ uri: item.image }} style={styles.image} />

        <View style={styles.rating}>
          <AppText variant="caption" color={Colors.white}>
            ★ {item.rating}
          </AppText>
        </View>

        <View style={styles.sportBadge}>
          <AppText variant="caption" color={Colors.white}>
            {item.sportName}
          </AppText>
        </View>
      </View>

      <View style={styles.content}>
        <AppText variant="h3">{item.name}</AppText>

        <AppText
          color={Colors.secondary}
          variant="caption"
          style={styles.location}
        >
          📍 {item.location}
        </AppText>

        <View style={styles.footer}>
          <View>
            <AppText variant="h3" color={Colors.accentDark}>
              ₹{item.price}
              <AppText color={Colors.secondary} variant="caption">
                {' '}
                / hour
              </AppText>
            </AppText>
          </View>

          <View style={styles.bookButton}>
            <AppText color={Colors.white} variant="caption">
              View Details →
            </AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },

  image: {
    width: '100%',
    height: 175,
    backgroundColor: Colors.border,
  },

  rating: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(16,24,40,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  sportBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  content: {
    padding: Spacing.lg,
  },

  location: {
    marginTop: 8,
  },

  footer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bookButton: {
    backgroundColor: Colors.accentDark,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
  },
});

export default GroundCard;
