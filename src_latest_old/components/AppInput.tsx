import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';

import { Colors, Spacing } from '../theme';
import AppText from './AppText';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  secureTextEntry?: boolean;
}

const AppInput: React.FC<Props> = ({
  label,
  error,
  secureTextEntry = false,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <AppText variant="bodyMedium" style={styles.label}>
        {label}
      </AppText>

      <View style={[styles.inputContainer, error ? styles.errorBorder : null]}>
        <TextInput
          {...rest}
          style={styles.input}
          placeholderTextColor={Colors.secondary}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize="none"
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <AppText color={Colors.accent} variant="bodyMedium">
              {showPassword ? 'Hide' : 'Show'}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {!!error && (
        <AppText color={Colors.error} variant="caption">
          {error}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },

  label: {
    marginBottom: Spacing.sm,
  },

  inputContainer: {
    height: 54,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },

  input: {
    flex: 1,
    height: '100%',
    color: Colors.textPrimary,
    fontSize: 15,
  },

  errorBorder: {
    borderColor: Colors.error,
  },
});

export default AppInput;
