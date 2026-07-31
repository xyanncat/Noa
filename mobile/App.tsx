import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ChatResponse = {
  response?: string;
  detail?: string;
};

const DEFAULT_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',
  default: 'http://127.0.0.1:8000/api',
});

function normalizeApiBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function responseMessage(payload: ChatResponse, fallback: string): string {
  return typeof payload.response === 'string' && payload.response.trim()
    ? payload.response
    : typeof payload.detail === 'string' && payload.detail.trim()
      ? payload.detail
      : fallback;
}

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL ?? '');
  const [apiKey, setApiKey] = useState('');
  const [showConnection, setShowConnection] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState('Set your Noa API address, then start a conversation.');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Noa Android is ready. Connect it to your Noa API to begin.',
    },
  ]);

  const configuredEndpoint = useMemo(() => normalizeApiBaseUrl(apiBaseUrl), [apiBaseUrl]);

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || isSending) return;

    if (!configuredEndpoint) {
      setShowConnection(true);
      setStatus('Enter the reachable Noa API address before sending a message.');
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    };

    setInput('');
    setIsSending(true);
    setStatus('Noa is planning a response…');
    setMessages((current) => [...current, userMessage]);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (apiKey.trim()) headers['X-API-Key'] = apiKey.trim();

      const response = await fetch(`${configuredEndpoint}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, session_id: 'mobile_session' }),
      });
      const payload = (await response.json().catch(() => ({}))) as ChatResponse;
      if (!response.ok) throw new Error(responseMessage(payload, `Noa API request failed with HTTP ${response.status}.`));

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: responseMessage(payload, 'Noa returned an empty response.'),
        },
      ]);
      setStatus('Connected to Noa.');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Could not reach the Noa API.';
      setMessages((current) => [...current, { id: `error-${Date.now()}`, role: 'assistant', content: messageText }]);
      setStatus('Connection failed. Check the API address and your phone network.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.shell}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>NOA / ANDROID CLIENT</Text>
              <Text style={styles.title}>Command stream</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setShowConnection((visible) => !visible)} style={styles.connectionButton}>
              <Text style={styles.connectionButtonText}>Connection</Text>
            </Pressable>
          </View>

          {showConnection ? (
            <View style={styles.connectionPanel}>
              <Text style={styles.panelTitle}>Noa API connection</Text>
              <Text style={styles.panelHint}>Use your computer’s LAN address on a physical phone. The Android emulator can use 10.0.2.2.</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                onChangeText={setApiBaseUrl}
                placeholder="http://192.168.1.10:8000/api"
                placeholderTextColor="#7d978d"
                style={styles.input}
                value={apiBaseUrl}
              />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setApiKey}
                placeholder="Optional API key"
                placeholderTextColor="#7d978d"
                secureTextEntry
                style={styles.input}
                value={apiKey}
              />
              <Text style={styles.panelHint}>The optional key stays only in this running app session and is never bundled into the APK.</Text>
            </View>
          ) : null}

          <Text style={styles.status}>{status}</Text>
          <ScrollView contentContainerStyle={styles.messages} style={styles.messageList} keyboardShouldPersistTaps="handled">
            {messages.map((item) => (
              <View key={item.id} style={[styles.message, item.role === 'user' ? styles.userMessage : styles.assistantMessage]}>
                <Text style={styles.messageRole}>{item.role === 'user' ? 'YOU' : 'NOA'}</Text>
                <Text style={styles.messageContent}>{item.content}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              editable={!isSending}
              multiline
              onChangeText={setInput}
              placeholder="Give Noa a goal…"
              placeholderTextColor="#7d978d"
              style={styles.composerInput}
              value={input}
            />
            <Pressable accessibilityRole="button" disabled={isSending} onPress={sendMessage} style={[styles.sendButton, isSending && styles.disabledButton]}>
              {isSending ? <ActivityIndicator color="#102018" /> : <Text style={styles.sendButtonText}>Send</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#07110f' },
  flex: { flex: 1 },
  shell: { flex: 1, gap: 12, padding: 18 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: '#c9f670', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: '#ecf7f1', fontSize: 29, fontWeight: '700', marginTop: 4 },
  connectionButton: { borderColor: '#45695c', borderRadius: 9, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 },
  connectionButtonText: { color: '#75e6da', fontSize: 12, fontWeight: '800' },
  connectionPanel: { backgroundColor: '#10251f', borderColor: '#2d4b40', borderRadius: 14, borderWidth: 1, gap: 9, padding: 12 },
  panelTitle: { color: '#ecf7f1', fontSize: 15, fontWeight: '800' },
  panelHint: { color: '#9bb5aa', fontSize: 12, lineHeight: 18 },
  input: { backgroundColor: '#07110f', borderColor: '#2d4b40', borderRadius: 9, borderWidth: 1, color: '#ecf7f1', padding: 10 },
  status: { color: '#9bb5aa', fontSize: 12, lineHeight: 18 },
  messageList: { flex: 1 },
  messages: { gap: 10, paddingBottom: 8 },
  message: { borderRadius: 14, padding: 12 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#1d493d', maxWidth: '88%' },
  assistantMessage: { alignSelf: 'flex-start', backgroundColor: '#10251f', borderColor: '#29453b', borderWidth: 1, maxWidth: '94%' },
  messageRole: { color: '#c9f670', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  messageContent: { color: '#e5f0eb', fontSize: 15, lineHeight: 21 },
  composer: { alignItems: 'flex-end', backgroundColor: '#0d201b', borderColor: '#2d4b40', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 9 },
  composerInput: { color: '#ecf7f1', flex: 1, maxHeight: 120, minHeight: 42, paddingHorizontal: 7, paddingVertical: 8 },
  sendButton: { alignItems: 'center', backgroundColor: '#c9f670', borderRadius: 9, justifyContent: 'center', minHeight: 42, paddingHorizontal: 15 },
  disabledButton: { opacity: 0.65 },
  sendButtonText: { color: '#102018', fontWeight: '800' },
});
