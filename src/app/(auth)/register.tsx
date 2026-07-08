import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { GoogleAuthButton } from "../../components/GoogleAuthButton";
import { useThemeColor } from "../../hooks/useThemeColor";
import { useAuth } from "../../providers/AuthProvider";
import { supabase } from "../../utils/supabase";

const { width, height } = Dimensions.get("window");

// Array of natively vertical (portrait) premium building/space backgrounds for mobile
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1555636222-cae831e670b3?q=80&w=1080&h=1920&auto=format&fit=crop", // Portrait skyscraper
  "https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1080&h=1920&auto=format&fit=crop", // Portrait modern apartment
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1080&h=1920&auto=format&fit=crop", // Portrait beautiful house
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1080&h=1920&auto=format&fit=crop", // Portrait luxury home
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=1080&h=1920&auto=format&fit=crop"  // Portrait modern interior
];

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"seeker" | "landlord">("seeker");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentBg, setCurrentBg] = useState(BG_IMAGES[0]);

  const { colors, isDark } = useThemeColor();
  const { refreshProfile } = useAuth();

  useFocusEffect(
    useCallback(() => {
      const randomIndex = Math.floor(Math.random() * BG_IMAGES.length);
      setCurrentBg(BG_IMAGES[randomIndex]);
    }, [])
  );

  // Animations
  const strengthValue = useSharedValue(0);
  const matchScale = useSharedValue(0);

  // Check password strength (0 to 4)
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 1;
    if (pass.match(/[A-Z]/)) score += 1;
    if (pass.match(/[0-9]/)) score += 1;
    if (pass.match(/[^A-Za-z0-9]/)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);
  const isMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  useEffect(() => {
    strengthValue.value = withTiming(strength, { duration: 300 });
  }, [strength]);

  useEffect(() => {
    matchScale.value = withSpring(isMatch ? 1 : 0, {
      damping: 12,
      stiffness: 90,
    });
  }, [isMatch]);

  const strengthBarStyle = useAnimatedStyle(() => {
    const widthPct = (strengthValue.value / 4) * 100;
    const color = interpolateColor(
      strengthValue.value,
      [0, 1, 2, 3, 4],
      ["#FF3B30", "#FF3B30", "#FF9500", "#34C759", "#34C759"],
    );
    return {
      width: `${widthPct}%`,
      backgroundColor: color,
    };
  });

  const strengthTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      strengthValue.value,
      [0, 1, 2, 3, 4],
      ["#FF3B30", "#FF3B30", "#FF9500", "#34C759", "#34C759"],
    );
    return { color };
  });

  const matchIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: matchScale.value }],
      opacity: matchScale.value,
    };
  });

  async function signUpWithEmail() {
    if (!email || !password || !confirmPassword || !fullName || !phoneNumber) {
      Toast.show({
        type: "error",
        text1: "Required",
        text2: "Please fill out all fields.",
      });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Passwords mismatch",
        text2: "Please ensure passwords match.",
      });
      return;
    }
    if (strength < 2) {
      Toast.show({
        type: "error",
        text1: "Weak Password",
        text2: "Please use a stronger password.",
      });
      return;
    }

    setLoading(true);
    const {
      data: { session, user },
      error,
    } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
          role: role,
        },
      },
    });

    if (error) {
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    } else {
      if (user) {
        await supabase
          .from("profiles")
          .update({ role, phone_number: phoneNumber })
          .eq("id", user.id);
        await refreshProfile();
      }
      if (!session) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Please check your inbox for email verification!",
        });
      }
    }
    setLoading(false);
  }

  // Super translucent glass settings so background shows through
  const glassBg = isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.25)"; // Slightly darker card
  const inputBg = isDark ? "rgba(0, 0, 0, 0.45)" : "rgba(0, 0, 0, 0.35)"; // Darker inputs for readability
  const inputBorder = isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.35)";
  const textColor = "#FFF"; // Force white text for better contrast on glass
  const iconColor = "#FFF";
  const placeholderColor = "rgba(255,255,255,0.7)";

  const getStrengthText = () => {
    if (password.length === 0) return "Enter a password";
    if (strength <= 1) return "Weak";
    if (strength === 2) return "Fair";
    if (strength === 3) return "Good";
    return "Strong";
  };

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
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                entering={FadeInDown.duration(800).springify()}
                style={styles.headerContainer}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name="diamond" size={24} color="#fff" />
                </View>
                <Text style={styles.appName}>SpaceFinder Pro</Text>
                <Text style={styles.tagline}>
                  Elevate your property experience.
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.duration(800).delay(200).springify()}
                style={styles.cardContainer}
              >
                <BlurView
                  intensity={30}
                  tint="light"
                  style={[styles.glassCard, { backgroundColor: glassBg, borderColor: 'rgba(255,255,255,0.4)' }]}
                >
                  {/* Custom Segmented Control for Roles */}
                  <View
                    style={[
                      styles.roleContainer,
                      {
                        backgroundColor: "rgba(255,255,255,0.15)",
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.roleBtn,
                        role === "seeker"
                          ? styles.roleBtnActive
                          : styles.roleBtnInactive,
                      ]}
                      onPress={() => setRole("seeker")}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="search"
                        size={18}
                        color={
                          role === "seeker"
                            ? "#FFF"
                            : "rgba(255,255,255,0.6)"
                        }
                      />
                      <Text
                        style={[
                          styles.roleText,
                          role === "seeker"
                            ? styles.roleTextActive
                            : { color: "rgba(255,255,255,0.6)" },
                        ]}
                      >
                        Seeker
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleBtn,
                        role === "landlord"
                          ? styles.roleBtnActive
                          : styles.roleBtnInactive,
                      ]}
                      onPress={() => setRole("landlord")}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="home"
                        size={18}
                        color={
                          role === "landlord"
                            ? "#FFF"
                            : "rgba(255,255,255,0.6)"
                        }
                      />
                      <Text
                        style={[
                          styles.roleText,
                          role === "landlord"
                            ? styles.roleTextActive
                            : { color: "rgba(255,255,255,0.6)" },
                        ]}
                      >
                        Landlord
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: inputBg, borderColor: inputBorder },
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={iconColor}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="Full Name"
                        placeholderTextColor={placeholderColor}
                        value={fullName}
                        autoCapitalize="words"
                        onChangeText={setFullName}
                      />
                    </View>

                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: inputBg, borderColor: inputBorder },
                      ]}
                    >
                      <Ionicons
                        name="call-outline"
                        size={20}
                        color={iconColor}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="Phone Number"
                        placeholderTextColor={placeholderColor}
                        value={phoneNumber}
                        keyboardType="phone-pad"
                        onChangeText={setPhoneNumber}
                      />
                    </View>

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

                    {/* Password Field */}
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

                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                      <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={styles.strengthContainer}
                      >
                        <View style={styles.strengthBarBg}>
                          <Animated.View
                            style={[styles.strengthBarFill, strengthBarStyle]}
                          />
                        </View>
                        <Animated.Text
                          style={[styles.strengthText, strengthTextStyle]}
                        >
                          {getStrengthText()}
                        </Animated.Text>
                      </Animated.View>
                    )}

                    {/* Confirm Password Field */}
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: inputBg, borderColor: inputBorder },
                      ]}
                    >
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={20}
                        color={iconColor}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="Confirm Password"
                        placeholderTextColor={placeholderColor}
                        value={confirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        onChangeText={setConfirmPassword}
                      />
                      {/* Bouncy Match Icon */}
                      <Animated.View
                        style={[styles.matchIconContainer, matchIconStyle]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#34C759"
                        />
                      </Animated.View>
                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={20}
                          color={iconColor}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={signUpWithEmail}
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
                          <Text style={styles.registerButtonText}>
                            Create Account
                          </Text>
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
                      Already have an account?{" "}
                    </Text>
                    <Link href="/(auth)/login" asChild>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text
                          style={[styles.loginLink, { color: "#fff" }]}
                        >
                          Sign In
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  </View>

                  <View style={styles.dividerContainer}>
                    <View
                      style={[
                        styles.dividerLine,
                        {
                          backgroundColor: "rgba(255,255,255,0.2)",
                        },
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
                        {
                          backgroundColor: "rgba(255,255,255,0.2)",
                        },
                      ]}
                    />
                  </View>

                  <GoogleAuthButton />
                </BlurView>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { width, height },
  gradientOverlay: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 0,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  appName: {
    fontSize: 28,
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
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
    padding: 16,
    borderWidth: 1,
  },
  roleContainer: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  roleBtnActive: {
    backgroundColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  roleBtnInactive: {
    backgroundColor: "transparent",
  },
  roleText: {
    fontSize: 15,
    fontFamily: "Outfit_600SemiBold",
  },
  roleTextActive: {
    color: "#fff",
  },
  inputContainer: {
    gap: 12,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
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
  matchIconContainer: {
    marginRight: 4,
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: -6,
    marginBottom: 2,
  },
  strengthBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(150,150,150,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginRight: 12,
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
    width: 45,
    textAlign: "right",
  },
  registerButton: {
    height: 48,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Outfit_700Bold",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
    fontFamily: "Outfit_500Medium",
  },
  loginLink: {
    fontSize: 15,
    fontFamily: "Outfit_700Bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
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
