import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Camera,
  ChevronLeft,
  Info,
  Plus,
  Send
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../components/ui/Avatar";
import { useThemeColor } from "../../hooks/useThemeColor";
import { useAuth } from "../../providers/AuthProvider";
import {
  ChatMessage,
  chatService,
  ChatSession,
} from "../../services/chatService";
import { propertyService } from "../../services/propertyService";
import { supabase } from "../../utils/supabase";

const { width } = Dimensions.get("window");

/**
 * The individual Chat Room screen.
 * Handles real-time messaging via Supabase subscriptions, message attachments (properties),
 * and optimistic UI updates for instant feedback.
 */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  const [landlordProperties, setLandlordProperties] = useState<any[]>([]);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const flatListRef = useRef<FlatList>(null);

  const snapPoints = useMemo(() => ["50%"], []);

  useEffect(() => {
    if (!id || !user) return;

    const loadChat = async () => {
      setLoading(true);
      const chatDetails = await chatService.getChatDetails(id);
      setSession(chatDetails);
      const msgs = await chatService.getMessages(id);
      setMessages(msgs);
      const allProps = await propertyService.getAllProperties();
      if (chatDetails?.landlord_id)
        setLandlordProperties(
          allProps.filter((p) => p.landlord_id === chatDetails.landlord_id),
        );
      setLoading(false);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: false }),
        100,
      );
    };

    loadChat();

    const subscription = supabase
      .channel(`chat_${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${id}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (newMessage.attached_property_id) {
            const msgs = await chatService.getMessages(id);
            setMessages(msgs);
          } else {
            setMessages((prev) => [...prev, newMessage]);
          }
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            100,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id, user]);

  const handleSend = async (attachedPropertyId?: string) => {
    if ((!inputText.trim() && !attachedPropertyId) || !user || !id) return;
    const textToSend = inputText.trim();
    setInputText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bottomSheetModalRef.current?.dismiss();

    const tempId = Math.random().toString();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      chat_id: id,
      sender_id: user.id,
      content: textToSend,
      is_read: false,
      created_at: new Date().toISOString(),
      attached_property_id: attachedPropertyId,
      attached_property: landlordProperties.find(
        (p) => p.id === attachedPropertyId,
      ),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    const newMsg = await chatService.sendMessage(
      id,
      user.id,
      textToSend,
      attachedPropertyId,
    );
    if (!newMsg) setMessages((prev) => prev.filter((m) => m.id !== tempId));
    else setMessages((prev) => prev.map((m) => (m.id === tempId ? newMsg : m)));
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    [],
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  const otherProfile =
    user?.id === session?.landlord_id ? session?.seeker : session?.landlord;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={0}
      >
        {/* Premium Header */}
        <View
          style={[styles.header, { backgroundColor: isDark ? 'rgba(10,15,30,0.95)' : 'rgba(255,255,255,0.95)', paddingTop: insets.top + 10, borderBottomColor: colors.border }]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerMain}>
            <Avatar size={40} online={true} />
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: colors.text }]}>
                {otherProfile?.full_name || "Premium Client"}
              </Text>
              <Text style={styles.headerStatus}>Concierge Active</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.headerBtn}>
            <Info size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Property Context */}
        {session?.property && (
          <View style={[styles.contextWrapper, { backgroundColor: isDark ? "rgba(10,15,30,0.5)" : "rgba(255,255,255,0.5)" }]}>
            <TouchableOpacity
              style={[styles.contextCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/property/${session.property.id}`)}
            >
              <Image
                source={{ uri: session.property.image_url }}
                style={styles.contextImg}
              />
              <View style={styles.contextInfo}>
                <Text style={[styles.contextLabel, { color: colors.textMuted }]}>REFERENCING PROPERTY</Text>
                <Text style={[styles.contextTitle, { color: colors.text }]} numberOfLines={1}>
                  {session.property.title}
                </Text>
              </View>
              <ChevronLeft
                size={16}
                color={colors.textMuted}
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.messageList, { paddingBottom: 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            const hasAttachment = !!item.attached_property;

            return (
              <View
                style={[
                  styles.messageRow,
                  isMe ? styles.rowMe : styles.rowThem,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.bubbleMe : [styles.bubbleThem, { backgroundColor: colors.card, borderColor: colors.border }],
                    hasAttachment && { padding: 4, width: 260 },
                  ]}
                >
                  {hasAttachment && (
                    <TouchableOpacity
                      style={[styles.attachmentCard, { backgroundColor: colors.surface }]}
                      onPress={() =>
                        router.push(`/property/${item.attached_property.id}`)
                      }
                    >
                      <Image
                        source={{ uri: item.attached_property.image_url }}
                        style={styles.attachmentImg}
                      />
                      <View style={styles.attachmentInfo}>
                        <Text
                          style={[
                            styles.attachmentTitle,
                            { color: isMe ? "#FFFFFF" : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {item.attached_property.title}
                        </Text>
                        <Text
                          style={[
                            styles.attachmentPrice,
                            { color: isMe ? "#FFFFFF" : "#0066FF" },
                          ]}
                        >
                          GHS{" "}
                          {Number(
                            item.attached_property.price,
                          ).toLocaleString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  {item.content ? (
                    <Text
                      style={[
                        styles.msgText,
                        { color: isMe ? "#FFFFFF" : colors.text },
                        hasAttachment && { padding: 12 },
                      ]}
                    >
                      {item.content}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Premium Input */}
        <View
          style={[
            styles.inputBar,
            { backgroundColor: isDark ? 'rgba(10,15,30,0.95)' : 'rgba(255,255,255,0.95)', paddingBottom: Math.max(insets.bottom, 20), borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => bottomSheetModalRef.current?.present()}
          >
            <Plus size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Message concierge..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          {inputText.trim().length > 0 ? (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => handleSend()}
            >
              <Send size={18} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cameraBtn}>
              <Camera size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Picker */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.card, borderRadius: 32 }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Share Property</Text>
          <BottomSheetFlatList
            data={landlordProperties}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.sheetItem, { backgroundColor: colors.surface }]}
                onPress={() => handleSend(item.id)}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.sheetItemImg}
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.sheetItemTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.sheetItemPrice}>
                    GHS {Number(item.price).toLocaleString()}
                  </Text>
                </View>
                <Send size={16} color="#0066FF" />
              </TouchableOpacity>
            )}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 8,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontFamily: "Outfit_700Bold" },
  headerStatus: {
    fontSize: 11,
    fontFamily: "Outfit_400Regular",
    color: "#10B981",
    marginTop: 2,
  },
  contextWrapper: { padding: 16 },
  contextCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  contextImg: { width: 40, height: 40, borderRadius: 6 },
  contextInfo: { flex: 1, marginLeft: 12 },
  contextLabel: {
    fontSize: 9,
    fontFamily: "Outfit_700Bold",
    letterSpacing: 0.5,
  },
  contextTitle: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
  },
  messageList: { padding: 20, gap: 16 },
  messageRow: { flexDirection: "row", width: "100%" },
  rowMe: { justifyContent: "flex-end" },
  rowThem: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleMe: { backgroundColor: "#0066FF", borderBottomRightRadius: 4 },
  bubbleThem: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  msgText: { fontSize: 15, fontFamily: "Outfit_400Regular", lineHeight: 22 },
  attachmentCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  attachmentImg: { width: "100%", height: 140 },
  attachmentInfo: { padding: 12 },
  attachmentTitle: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    marginBottom: 4,
  },
  attachmentPrice: { fontSize: 13, fontFamily: "Outfit_700Bold" },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0066FF",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetContent: { flex: 1, padding: 24 },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: 20,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  sheetItemImg: { width: 50, height: 50, borderRadius: 8 },
  sheetItemTitle: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
  },
  sheetItemPrice: {
    fontSize: 13,
    fontFamily: "Outfit_700Bold",
    color: "#0066FF",
    marginTop: 4,
  },
});
