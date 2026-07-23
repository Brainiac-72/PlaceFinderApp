import React, { createContext, ReactNode, useContext, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import { useThemeColor } from "../hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";

export type AlertButtonStyle = "default" | "cancel" | "destructive";

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

/**
 * The data shape exposed by the AlertContext to child components.
 */
interface AlertContextData {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextData | undefined>(undefined);

const { width } = Dimensions.get("window");

// Fallback default button
const DEFAULT_BUTTONS: AlertButton[] = [{ text: "OK" }];

/**
 * Global provider for custom, highly-styled alert modals.
 * Wraps the app to allow any component to trigger a unified alert dialog
 * that matches the app's dark/light theme, replacing default system alerts.
 */
export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const { colors, isDark } = useThemeColor();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
  ) => {
    setOptions({
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : DEFAULT_BUTTONS,
    });
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={handleClose} />

            {visible && (
              <Animated.View
                entering={ZoomIn.duration(200)}
                exiting={ZoomOut.duration(150)}
                style={[
                  styles.alertContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                    shadowColor: isDark ? "#006A4E" : "#000",
                  },
                ]}
              >
                {/* Decorative Top Accent Bar using brand green */}
                <View style={[styles.topAccentBar, { backgroundColor: colors.primary || '#006A4E' }]} />

                <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
                  {/* Decorative Icon Circle */}
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(0, 106, 78, 0.15)" : "#E8F7F2" }]}>
                    <Ionicons name="notifications" size={24} color={colors.primary || '#006A4E'} />
                  </View>

                  <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.text }]}>
                      {options?.title}
                    </Text>
                    {!!options?.message && (
                      <Text
                        style={[styles.message, { color: colors.textSecondary }]}
                      >
                        {options.message}
                      </Text>
                    )}
                  </View>
                </ScrollView>

                {/* Modern Pill Buttons Footer */}
                <View style={[
                  styles.footerContainer,
                  {
                    flexDirection: options?.buttons?.length === 2 ? "row" : "column",
                  }
                ]}>
                  {options?.buttons?.map((btn, index) => {
                    const isDestructive = btn.style === "destructive";
                    const isCancel = btn.style === "cancel";
                    const isPrimary = !isCancel && !isDestructive;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.pillButton,
                          isPrimary && { backgroundColor: colors.primary || '#006A4E' },
                          isDestructive && { backgroundColor: colors.error || '#EF4444' },
                          isCancel && {
                            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                            borderWidth: 1,
                            borderColor: colors.border,
                          },
                          options.buttons!.length === 2 ? { flex: 1, marginHorizontal: 6 } : { width: "100%", marginBottom: 8 }
                        ]}
                        onPress={() => handleButtonPress(btn)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.pillButtonText,
                            isPrimary && { color: "#FFF", fontFamily: "Outfit_700Bold" },
                            isDestructive && { color: "#FFF", fontFamily: "Outfit_700Bold" },
                            isCancel && { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" },
                          ]}
                        >
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AlertContext.Provider>
  );
};

/**
 * Hook to access the global custom alert function.
 * Use `const { showAlert } = useCustomAlert();` to trigger modals.
 */
export const useCustomAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useCustomAlert must be used within an AlertProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  alertContainer: {
    width: width * 0.88,
    maxWidth: 340,
    borderRadius: 24,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
  },
  topAccentBar: {
    height: 5,
    width: "100%",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    alignSelf: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  footerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  pillButton: {
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  pillButtonText: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
});
