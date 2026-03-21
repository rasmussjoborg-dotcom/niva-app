import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { getAnalysis, chatWithAI, type AnalysisData } from "../../../lib/api";
import { Colors } from "../../../lib/theme";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_TOPICS = [
  "Hur ser föreningens ekonomi ut?",
  "Vilka risker bör jag vara medveten om?",
  "Är månadsavgiften rimlig?",
  "Vad kostar liknande bostäder i området?",
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const flatListRef = useRef<FlatList>(null);

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAnalysis(parseInt(id))
      .then((a) => {
        setAnalysis(a);
        // Welcome message
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `Hej! Jag är Nivås AI-expert. Jag har analyserat ${a.address || "denna bostad"} och kan svara på frågor om föreningen, ekonomin och risker. Vad vill du veta?`,
            timestamp: new Date(),
          },
        ]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function sendMessage(text: string) {
    if (!analysis || !text.trim() || sending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const { response } = await chatWithAI(analysis.property_id, text.trim());
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Tyvärr kunde jag inte svara just nu. Försök igen.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <Stack.Screen
        options={{
          title: "AI-expert",
          headerStyle: { backgroundColor: Colors.linen },
          headerTintColor: Colors.midnight,
          headerTitleStyle: { fontFamily: "DMSans_700Bold", fontSize: 16 },
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View
              style={[
                s.bubble,
                item.role === "user" ? s.userBubble : s.aiBubble,
              ]}
            >
              {item.role === "assistant" && (
                <Text style={s.bubbleLabel}>✦ Nivå AI</Text>
              )}
              <Text
                style={[
                  s.bubbleText,
                  item.role === "user" && { color: Colors.white },
                ]}
              >
                {item.content}
              </Text>
            </View>
          )}
          ListFooterComponent={
            sending ? (
              <View style={[s.bubble, s.aiBubble]}>
                <Text style={s.bubbleLabel}>✦ Nivå AI</Text>
                <ActivityIndicator color={Colors.gold} size="small" />
              </View>
            ) : messages.length <= 1 ? (
              <View style={s.suggestionsBox}>
                <Text style={s.suggestionsTitle}>Förslag</Text>
                {SUGGESTED_TOPICS.map((topic) => (
                  <Pressable
                    key={topic}
                    onPress={() => sendMessage(topic)}
                    style={s.suggestionChip}
                  >
                    <Text style={s.suggestionText}>{topic}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null
          }
        />

        {/* Input bar */}
        <View style={s.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ställ en fråga..."
            placeholderTextColor={Colors.textMuted}
            style={s.textInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(input)}
          />
          <Pressable
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            style={[s.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
          >
            <Text style={s.sendBtnText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.linen },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.linen },

  messageList: { padding: 16, paddingBottom: 8 },

  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.midnight,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleLabel: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    color: Colors.gold,
    marginBottom: 6,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },

  suggestionsBox: { paddingHorizontal: 4, marginTop: 8 },
  suggestionsTitle: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  suggestionChip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
  },
  suggestionText: { fontSize: 14, color: Colors.midnight },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: 28,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: Colors.linen,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.midnight,
    fontFamily: "DMSans_400Regular",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.midnight,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
  },
});
