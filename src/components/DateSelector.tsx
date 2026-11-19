import React, { useMemo } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface UnavailableDateRange {
  id: string;
  fromDate: string;
  toDate: string;
  reason?: string;
}

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  unavailableRanges?: UnavailableDateRange[];
}

interface DateItem {
  value: string;
  day: string;
  date: string;
  month: string;
  label: string;
}

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const DateSelector = ({
  selectedDate,
  onSelectDate,
  unavailableRanges = [],
}: DateSelectorProps) => {
  const dates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateList: DateItem[] = [];

    for (let index = 0; index < 30; index++) {
      const currentDate = new Date(today);

      currentDate.setDate(today.getDate() + index);

      let label = currentDate.toLocaleDateString('en-US', {
        weekday: 'short',
      });

      if (index === 0) {
        label = 'Today';
      } else if (index === 1) {
        label = 'Tomorrow';
      }

      dateList.push({
        value: getLocalDateString(currentDate),
        day: currentDate.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        date: String(currentDate.getDate()),
        month: currentDate.toLocaleDateString('en-US', {
          month: 'short',
        }),
        label,
      });
    }

    return dateList;
  }, []);

  const isDateUnavailable = (date: string) => {
    return unavailableRanges.some(
      range => date >= range.fromDate && date <= range.toDate,
    );
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map(item => {
          const isSelected = selectedDate === item.value;
          const isUnavailable = isDateUnavailable(item.value);

          return (
            <TouchableOpacity
              key={item.value}
              activeOpacity={isUnavailable ? 1 : 0.8}
              disabled={isUnavailable}
              onPress={() => onSelectDate(item.value)}
              style={[
                styles.dateCard,
                isUnavailable && styles.unavailableDateCard,
                isSelected && !isUnavailable && styles.selectedDateCard,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isUnavailable && styles.unavailableText,
                  isSelected && !isUnavailable && styles.selectedText,
                ]}
              >
                {item.label}
              </Text>

              <Text
                style={[
                  styles.dateText,
                  isUnavailable && styles.unavailableText,
                  isSelected && !isUnavailable && styles.selectedText,
                ]}
              >
                {item.date}
              </Text>

              <Text
                style={[
                  styles.monthText,
                  isUnavailable && styles.unavailableText,
                  isSelected && !isUnavailable && styles.selectedText,
                ]}
              >
                {item.month}
              </Text>

              {isUnavailable ? (
                <View style={styles.unavailableIndicator} />
              ) : (
                isSelected && <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={styles.availableDot} />
          <Text style={styles.legendText}>Available</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={styles.selectedDot} />
          <Text style={styles.legendText}>Selected</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={styles.unavailableDot} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 10,
  },

  scrollContent: {
    paddingRight: 12,
    paddingVertical: 5,
  },

  dateCard: {
    width: 68,
    height: 88,
    backgroundColor: '#F9FAFB',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
  },

  selectedDateCard: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },

  unavailableDateCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    opacity: 0.9,
  },

  dayText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },

  dateText: {
    fontSize: 23,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 3,
  },

  monthText: {
    fontSize: 11,
    color: '#6B7280',
  },

  selectedText: {
    color: '#FFFFFF',
  },

  unavailableText: {
    color: '#DC2626',
  },

  selectedIndicator: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  unavailableIndicator: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },

  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 18,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 5,
  },

  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },

  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#166534',
  },

  unavailableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
});

export default DateSelector;
