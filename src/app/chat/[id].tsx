import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
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
import { PremiumAvatar } from "../../components/premium/PremiumAvatar";
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

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  const [ownerProperties, setOwnerProperties] = useState<any[]>([]);
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
      if (chatDetails?.owner_id)
        setOwnerProperties(
          allProps.filter((p) => p.owner_id === chatDetails.owner_id),
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
      attached_property: ownerProperties.find(
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
            backgroundColor: "#0A0F1E",
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  const otherProfile =
    user?.id === session?.owner_id ? session?.seeker : session?.owner;

  return (
    <View style={[styles.container, { backgroundColor: "#0A0F1E" }]}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Premium Header */}
        <BlurView
          intensity={100}
          tint="dark"
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
          >
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerMain}>
            <PremiumAvatar size={40} online={true} />
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>
                {otherProfile?.full_name || "Premium Client"}
              </Text>
              <Text style={styles.headerStatus}>Concierge Active</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.headerBtn}>
            <Info size={20} color="#6B7280" />
          </TouchableOpacity>
        </BlurView>

        {/* Property Context */}
        {session?.property && (
          <View style={styles.contextWrapper}>
            <TouchableOpacity
              style={styles.contextCard}
              onPress={() => router.push(`/property/${session.property.id}`)}
            >
              <Image
                source={{ uri: session.property.image_url }}
                style={styles.contextImg}
              />
              <View style={styles.contextInfo}>
                <Text style={styles.contextLabel}>REFERENCING PROPERTY</Text>
                <Text style={styles.contextTitle} numberOfLines={1}>
                  {session.property.title}
                </Text>
              </View>
              <ChevronLeft
                size={16}
                color="#6B7280"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messageList, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
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
                    isMe ? styles.bubbleMe : styles.bubbleThem,
                    hasAttachment && { padding: 4, width: 260 },
                  ]}
                >
                  {hasAttachment && (
                    <TouchableOpacity
                      style={styles.attachmentCard}
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
                            { color: isMe ? "#0A0F1E" : "#F9FAFB" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.attached_property.title}
                        </Text>
                        <Text
                          style={[
                            styles.attachmentPrice,
                            { color: isMe ? "#0A0F1E" : "#F59E0B" },
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
                        { color: isMe ? "#0A0F1E" : "#F9FAFB" },
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
        <BlurView
          intensity={100}
          tint="dark"
          style={[
            styles.inputBar,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => bottomSheetModalRef.current?.present()}
          >
            <Plus size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Message concierge..."
            placeholderTextColor="#6B7280"
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
              <Send size={18} color="#0A0F1E" fill="#0A0F1E" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cameraBtn}>
              <Camera size={22} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </BlurView>
      </KeyboardAvoidingView>

      {/* Attachment Picker */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#111827", borderRadius: 32 }}
        handleIndicatorStyle={{ backgroundColor: "#374151", width: 40 }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Share Property</Text>
          <BottomSheetFlatList
            data={ownerProperties}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => handleSend(item.id)}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.sheetItemImg}
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.sheetItemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.sheetItemPrice}>
                    GHS {Number(item.price).toLocaleString()}
                  </Text>
                </View>
                <Send size={16} color="#F59E0B" />
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
    borderBottomColor: "rgba(255,255,255,0.05)",
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
  headerName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#F9FAFB" },
  headerStatus: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#10B981",
    marginTop: 2,
  },
  contextWrapper: { padding: 16, backgroundColor: "rgba(10,15,30,0.5)" },
  contextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  contextImg: { width: 40, height: 40, borderRadius: 6 },
  contextInfo: { flex: 1, marginLeft: 12 },
  contextLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  contextTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#F9FAFB",
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
  bubbleMe: { backgroundColor: "#F59E0B", borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: "#111827",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  msgText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  attachmentCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  attachmentImg: { width: "100%", height: 140 },
  attachmentInfo: { padding: 12 },
  attachmentTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  attachmentPrice: { fontSize: 13, fontFamily: "Inter_700Bold" },
  inputBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  attachBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#F9FAFB",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F59E0B",
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
    color: "#F9FAFB",
    marginBottom: 20,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  sheetItemImg: { width: 50, height: 50, borderRadius: 8 },
  sheetItemTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#F9FAFB",
  },
  sheetItemPrice: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#F59E0B",
    marginTop: 4,
  },
});
