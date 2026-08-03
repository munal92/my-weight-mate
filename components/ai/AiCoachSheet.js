import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import colors from "../../styles/colors";
import { askCoach } from "../../services/aiCoach";
import { getSpecies, INSIGHT } from "../../domain/species";

/**
 * Chat sheet for the AI assistant.
 *
 * Suggested prompts are picked from the species' insight kind, so a cat owner
 * is offered questions about body condition and a parent is offered questions
 * about growth, rather than everyone seeing the same generic list.
 */

const SUGGESTIONS_BY_INSIGHT = {
  [INSIGHT.BMI]: [
    "What does my BMI mean?",
    "Is my weight trend healthy?",
    "How fast should I aim to lose weight?",
  ],
  [INSIGHT.PERCENTILE]: [
    "Is this growth pattern normal?",
    "What does this percentile mean?",
    "When should I talk to a doctor?",
  ],
  [INSIGHT.BCS]: [
    "Is this a healthy weight?",
    "How do I check the body condition score?",
    "How should I adjust feeding?",
  ],
};

const AiCoachSheet = ({ visible, onClose, profile, insights }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  const species = getSpecies(profile?.species);
  const suggestions = SUGGESTIONS_BY_INSIGHT[species.insight] ?? [];

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const nextMessages = [...messages, { role: "user", content: trimmed }];
      setMessages(nextMessages);
      setInput("");
      setError(null);
      setIsSending(true);

      try {
        const reply = await askCoach({
          profile,
          insights,
          messages: nextMessages,
          locale: i18n.language,
        });
        setMessages([...nextMessages, { role: "assistant", content: reply }]);
      } catch (err) {
        // Keep the user's message on screen so they can retry without retyping.
        const messageKey =
          {
            not_configured: "The assistant is not set up yet.",
            not_entitled: "This feature needs an active subscription.",
            rate_limited: "Too many questions right now. Try again in a moment.",
            network: "Check your connection and try again",
          }[err.code] ?? "The assistant is unavailable right now.";
        setError(t(messageKey));
      } finally {
        setIsSending(false);
      }
    },
    [messages, isSending, profile, insights, i18n.language, t]
  );

  const handleClose = () => {
    setMessages([]);
    setInput("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheet}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t("Assistant")}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            {t(
              "General information only. Not a substitute for a doctor or a vet."
            )}
          </Text>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, index) => String(index)}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.suggestions}>
                {suggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => send(t(suggestion))}
                  >
                    <Text style={styles.suggestionText}>{t(suggestion)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.role === "user" ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={
                    item.role === "user" ? styles.userText : styles.aiText
                  }
                >
                  {item.content}
                </Text>
              </View>
            )}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={t("Ask a question")}
              placeholderTextColor={colors.textSecondary}
              multiline
              onSubmitEditing={() => send(input)}
            />
            <TouchableOpacity
              style={[styles.sendButton, isSending && styles.disabled]}
              onPress={() => send(input)}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="arrow-up" size={22} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    maxHeight: "85%",
    minHeight: "55%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontFamily: "Barlow_600SemiBold",
    color: colors.textPrimary,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 10,
  },
  messages: { paddingVertical: 8, gap: 10 },
  suggestions: { gap: 8, paddingTop: 8 },
  suggestionChip: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  suggestionText: { fontSize: 14, color: colors.textPrimary },
  bubble: {
    maxWidth: "85%",
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.icongradient1 },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "white" },
  userText: { color: "white", fontSize: 15 },
  aiText: { color: colors.textPrimary, fontSize: 15 },
  error: { color: colors.accent, fontSize: 13, marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 110,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: "white",
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.addProfilebtnBg,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.6 },
});

export default AiCoachSheet;
