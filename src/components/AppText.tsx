import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';

import { Colors, Typography } from '../theme';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'bodyMedium' | 'caption';

interface Props extends TextProps {
  children: React.ReactNode;
  variant?: Variant;
  color?: string;
  style?: TextStyle;
}

const AppText: React.FC<Props> = ({
  children,
  variant = 'body',
  color = Colors.textPrimary,
  style,
  ...rest
}) => {
  return (
    <Text
      {...rest}
      style={[styles.base, Typography[variant], { color }, style]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});

export default AppText;
