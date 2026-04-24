import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextData {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextData | undefined>(undefined);

const { width } = Dimensions.get('window');

// Fallback default button
const DEFAULT_BUTTONS: AlertButton[] = [{ text: 'OK' }];

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const { colors, isDark } = useThemeColor();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
    setOptions({ title, message, buttons: buttons && buttons.length > 0 ? buttons : DEFAULT_BUTTONS });
    setVisible(true);
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleButtonPress = (btn: AlertButton) => {
    // Hide the native modal first immediately
    handleClose();
    // Then call the callback
    if (btn.onPress) {
      setTimeout(() => {
        btn.onPress!();
      }, 50); // slight delay to allow modal out animation to feel smooth
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      <Modal transparent visible={visible} animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={handleClose} />
            
            {visible && (
              <Animated.View 
                entering={ZoomIn.duration(200)} 
                exiting={ZoomOut.duration(150)}
                style={[styles.alertContainer, { backgroundColor: colors.card, shadowColor: isDark ? '#fff' : '#000' }]}
              >
                <View style={styles.content}>
                  <Text style={[styles.title, { color: colors.text }]}>{options?.title}</Text>
                  {!!options?.message && <Text style={[styles.message, { color: colors.textSecondary }]}>{options.message}</Text>}
                </View>

                {(() => {
                  const numButtons = options?.buttons?.length || 0;
                  const isVertical = numButtons > 2;
                  
                  return (
                    <ScrollView 
                      style={[
                        isVertical && { maxHeight: 300 }, // Cap button list height if vertical
                        { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }
                      ]}
                      bounces={false}
                      showsVerticalScrollIndicator={true}
                    >
                      <View style={[
                        styles.buttonsContainer, 
                        isVertical && { flexDirection: 'column' }
                      ]}>
                        {options?.buttons?.map((btn, index) => {
                          const isLast = index === options.buttons!.length - 1;
                          const isDestructive = btn.style === 'destructive';
                          const isCancel = btn.style === 'cancel';
                          
                          return (
                            <TouchableOpacity 
                              key={index} 
                              style={[
                                styles.button, 
                                !isVertical && !isLast && styles.buttonBorderRight,
                                !isVertical && !isLast && { borderRightColor: colors.border },
                                isVertical && !isLast && styles.buttonBorderBottom,
                                isVertical && !isLast && { borderBottomColor: colors.border },
                                isVertical && { width: '100%', minHeight: 48 }
                              ]} 
                              onPress={() => handleButtonPress(btn)}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.buttonText,
                                isCancel && { color: colors.textSecondary, fontWeight: '500' },
                                isDestructive && { color: colors.error, fontWeight: '700' },
                                !isCancel && !isDestructive && { color: colors.primary, fontWeight: '700' }
                                ]}>
                                {btn.text}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  );
                })()}
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useCustomAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within an AlertProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 340,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  buttonsContainer: {
    flexDirection: 'row',
    minHeight: 52,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  buttonBorderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  buttonBorderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  buttonText: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
