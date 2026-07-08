import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { GoogleAuthButton } from "../../components/GoogleAuthButton";
import { useThemeColor } from "../../hooks/useThemeColor";
import { supabase } from "../../utils/supabase";

const { width, height } = Dimensions.get("window");

// Array of natively vertical (portrait) premium building/space backgrounds for mobile
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1555636222-cae831e670b3?q=80&w=1080&h=1920&auto=format&fit=crop", // Portrait skyscraper
  "https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1080&h=1920&auto=format&fit=crop", // Portrait modern apartment
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1080&h=1920&auto=format&fit=crop", // Portrait beautiful house
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1080&h=1920&auto=format&fit=crop", // Portrait luxury home
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=1080&h=1920&auto=format&fit=crop", // Portrait modern interior
];

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentBg, setCurrentBg] = useState(BG_IMAGES[0]);
  const { colors, isDark } = useThemeColor();

  useFocusEffect(
    useCallback(() => {
      const randomIndex = Math.floor(Math.random() * BG_IMAGES.length);
      setCurrentBg(BG_IMAGES[randomIndex]);
    }, []),
  );

  async function signInWithEmail() {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Required",
        text2: "Please enter both email and password.",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      Toast.show({
        type: "error",
        text1: "Authentication Failed",
        text2: error.message,
      });
    }
    setLoading(false);
  }

  // Super translucent glass settings so background shows through
  const glassBg = isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.25)"; // Slightly darker card
  const inputBg = isDark ? "rgba(0, 0, 0, 0.45)" : "rgba(0, 0, 0, 0.35)"; // Darker inputs for readability
  const inputBorder = isDark
    ? "rgba(255, 255, 255, 0.2)"
    : "rgba(255, 255, 255, 0.35)";
  const textColor = "#FFF"; // Force white text for better contrast on glass
  const iconColor = "#FFF";
  const placeholderColor = "rgba(255,255,255,0.7)";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{ uri: currentBg }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.6)"]}
          style={styles.gradientOverlay}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.contentWrapper}>
              <Animated.View
                entering={FadeInDown.duration(800).springify()}
                style={styles.headerContainer}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name="diamond" size={42} color="#fff" />
                </View>
                <Text style={styles.appName}>SpaceFinder</Text>
                <Text style={styles.tagline}>
                  Unlock premium properties seamlessly.
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.duration(800).delay(200).springify()}
                style={styles.cardContainer}
              >
                <BlurView
                  intensity={30}
                  tint="light"
                  style={[
                    styles.glassCard,
                    {
                      backgroundColor: glassBg,
                      borderColor: "rgba(255,255,255,0.4)",
                    },
                  ]}
                >
                  <Text style={[styles.loginTitle, { color: "#fff" }]}>
                    Welcome Back
                  </Text>

                  <View style={styles.inputContainer}>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: inputBg, borderColor: inputBorder },
                      ]}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={iconColor}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="Email Address"
                        placeholderTextColor={placeholderColor}
                        value={email}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onChangeText={setEmail}
                      />
                    </View>

                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: inputBg, borderColor: inputBorder },
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={iconColor}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="Password"
                        placeholderTextColor={placeholderColor}
                        value={password}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
                          size={20}
                          color={iconColor}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={signInWithEmail}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        isDark ? ["#0A84FF", "#0040DD"] : ["#007AFF", "#0056b3"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>Sign In</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={20}
                            color="#fff"
                            style={{ marginLeft: 8 }}
                          />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.footerRow}>
                    <Text
                      style={[
                        styles.footerText,
                        { color: "rgba(255,255,255,0.8)" },
                      ]}
                    >
                      New to SpaceFinder?{" "}
                    </Text>
                    <Link href="/(auth)/register" asChild>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={[styles.registerLink, { color: "#fff" }]}>
                          Create an account
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  </View>

                  <View style={styles.dividerContainer}>
                    <View
                      style={[
                        styles.dividerLine,
                        { backgroundColor: "rgba(255,255,255,0.2)" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dividerText,
                        { color: "rgba(255,255,255,0.6)" },
                      ]}
                    >
                      OR
                    </Text>
                    <View
                      style={[
                        styles.dividerLine,
                        { backgroundColor: "rgba(255,255,255,0.2)" },
                      ]}
                    />
                  </View>

                  <GoogleAuthButton />
                </BlurView>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: width,
    height: height,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: "center",
  },
  keyboardView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  appName: {
    fontSize: 38,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Outfit_500Medium",
  },
  cardContainer: {
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  glassCard: {
    padding: 32,
    borderWidth: 1,
  },
  loginTitle: {
    fontSize: 26,
    fontFamily: "Outfit_800ExtraBold",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
    height: "100%",
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
    fontFamily: "Outfit_500Medium",
  },
  registerLink: {
    fontSize: 15,
    fontFamily: "Outfit_700Bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontFamily: "Outfit_700Bold",
    letterSpacing: 1,
  },
});
