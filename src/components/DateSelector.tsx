import React, { useMemo } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
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

const DateSelector = ({ selectedDate, onSelectDate }: DateSelectorProps) => {
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

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map(item => {
          const isSelected = selectedDate === item.value;

          return (
            <TouchableOpacity
              key={item.value}
              activeOpacity={0.8}
              onPress={() => onSelectDate(item.value)}
              style={[styles.dateCard, isSelected && styles.selectedDateCard]}
            >
              <Text style={[styles.dayText, isSelected && styles.selectedText]}>
                {item.label}
              </Text>

              <Text
                style={[styles.dateText, isSelected && styles.selectedText]}
              >
                {item.date}
              </Text>

              <Text
                style={[styles.monthText, isSelected && styles.selectedText]}
              >
                {item.month}
              </Text>

              {isSelected && <View style={styles.selectedIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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

  selectedIndicator: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});

export default DateSelector;
