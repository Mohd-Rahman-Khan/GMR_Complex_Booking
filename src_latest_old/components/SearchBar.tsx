import React from 'react';

import { View, TextInput, StyleSheet } from 'react-native';

import AppText from './AppText';
import { Colors, Spacing } from '../theme';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<Props> = ({
  value,
  onChangeText,
  placeholder = 'Search sports or grounds...',
}) => {
  return (
    <View style={styles.container}>
      <AppText variant="h3" color={Colors.secondary}>
        ⌕
      </AppText>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.secondary}
        style={styles.input}
        returnKeyType="search"
      />

      {value.length > 0 && (
        <AppText color={Colors.accentDark} onPress={() => onChangeText('')}>
          Clear
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
});

export default SearchBar;
