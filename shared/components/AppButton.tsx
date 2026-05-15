import { StyleSheet, Pressable, PressableProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors } from '../theme/colors';

export interface AppButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

export function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  ...rest
}: AppButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return '#A1A1AA';
    switch (variant) {
      case 'secondary':
        return colors.riovoley.secondary;
      case 'danger':
        return colors.riovoley.danger;
      case 'outline':
        return 'transparent';
      case 'primary':
      default:
        return colors.riovoley.primary;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return colors.riovoley.primary;
    }
    return 'transparent';
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return 8;
      case 'lg':
        return 16;
      case 'md':
      default:
        return 12;
    }
  };

  return (
    <Pressable
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          paddingVertical: getPadding(),
        },
        style,
      ]}
      {...rest}>
      <ThemedText
        style={{
          color: variant === 'outline' ? colors.riovoley.primary : '#fff',
          fontWeight: '600',
        }}>
        {loading ? '...' : label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
