import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GeneratedSlot } from '../types/booking';

interface SlotCardProps {
  slot: GeneratedSlot;
  selected: boolean;
  onPress: () => void;
}

const SlotCard = ({ slot, selected, onPress }: SlotCardProps) => {
  const isAvailable = slot.status === 'available';
  const isBooked = slot.status === 'booked';
  const isUnavailable = slot.status === 'unavailable';

  const getStatusLabel = () => {
    if (isBooked) {
      return 'Booked';
    }

    if (isUnavailable) {
      return 'Unavailable';
    }

    return selected ? 'Selected' : 'Available';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!isAvailable}
      onPress={onPress}
      style={[
        styles.container,
        isBooked && styles.bookedContainer,
        isUnavailable && styles.unavailableContainer,
        selected && styles.selectedContainer,
      ]}
    >
      {/* Status */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            isBooked && styles.bookedDot,
            isUnavailable && styles.unavailableDot,
            selected && styles.selectedDot,
          ]}
        />

        <Text
          style={[
            styles.statusText,
            isBooked && styles.bookedText,
            isUnavailable && styles.unavailableText,
            selected && styles.selectedText,
          ]}
        >
          {getStatusLabel()}
        </Text>
      </View>

      {/* Time */}
      <View style={styles.timeContainer}>
        <Text
          style={[
            styles.timeText,
            selected && styles.selectedText,
            !isAvailable && styles.disabledText,
          ]}
        >
          {slot.startTime}
        </Text>

        <Text
          style={[
            styles.toText,
            selected && styles.selectedText,
            !isAvailable && styles.disabledText,
          ]}
        >
          to
        </Text>

        <Text
          style={[
            styles.timeText,
            selected && styles.selectedText,
            !isAvailable && styles.disabledText,
          ]}
        >
          {slot.endTime}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, selected && styles.selectedDivider]} />

      {/* Price */}
      <View style={styles.priceContainer}>
        <Text
          style={[
            styles.priceLabel,
            selected && styles.selectedText,
            !isAvailable && styles.disabledText,
          ]}
        >
          Slot Price
        </Text>

        <Text
          style={[
            styles.priceText,
            selected && styles.selectedText,
            !isAvailable && styles.disabledText,
          ]}
        >
          ₹{slot.price.toLocaleString('en-IN')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 13,
  },

  selectedContainer: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },

  bookedContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  unavailableContainer: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 5,
  },

  selectedDot: {
    backgroundColor: '#FFFFFF',
  },

  bookedDot: {
    backgroundColor: '#DC2626',
  },

  unavailableDot: {
    backgroundColor: '#9CA3AF',
  },

  statusText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '600',
  },

  selectedText: {
    color: '#FFFFFF',
  },

  bookedText: {
    color: '#DC2626',
  },

  unavailableText: {
    color: '#9CA3AF',
  },

  timeContainer: {
    alignItems: 'center',
  },

  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },

  toText: {
    fontSize: 10,
    color: '#6B7280',
    marginVertical: 3,
  },

  disabledText: {
    color: '#9CA3AF',
  },

  divider: {
    height: 1,
    backgroundColor: '#BBF7D0',
    marginVertical: 12,
  },

  selectedDivider: {
    backgroundColor: '#4ADE80',
  },

  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  priceLabel: {
    fontSize: 10,
    color: '#6B7280',
  },

  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
});

export default SlotCard;
