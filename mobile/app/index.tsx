import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NoaSocket, type ChatResponse, type NoaSocketEvent } from '@noa/api-client';
import { SetupNotice } from '@/components/SetupNotice';
import { Screen } from '@/components/Screen';
import { getNoaClient, mobileSessionId } from '@/lib/noa';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; planStatus?: string };

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'welcome', role: 'assistant', content: 'Noa mobile is ready. I use the same safety-scoped plans and session memory as desktop.' }]);
  const [input, setInput] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string>();
  const [trace, setTrace] = useState<string>();
  const socketRef = useRef<NoaSocket | null>(null);
  const clientResult = useMemo(() => { try { return { client: getNoaClient() }; } catch (configurationError) { return { error: configurationError instanceof Error ? configurationError.message : 'Backend is not configured.' }; } }, []);

  const appendResponse = (response: ChatResponse) => {
    setMessages((items) => [...items, { id: response.plan.execution_id, role: 'assistant', content: response.response, planStatus: response.plan.status }]);
    setTrace(`${response.plan.steps.length} planned steps · ${response.plan.status}`);
    setIsWorking(false);
  };

  const send = async () => {
    const message = input.trim();
    if (!message || isWorking || !clientResult.client) return;
    setInput(''); setError(undefined); setTrace('Connecting to Noa…'); setIsWorking(true);
    setMessages((items) => [...items, { id: `user-${Date.now()}`, role: 'user', content: message }]);
    const socket = new NoaSocket({ apiBaseUrl: clientResult.client.baseUrl, apiKey: clientResult.client.apiKey, sessionId: mobileSessionId });
    socketRef.current = socket;
    const unsubscribe = socket.onEvent((event: NoaSocketEvent) => {
      if (event.type === 'plan.created') setTrace(`Planning ${event.data.plan.steps.length} safe steps…`);
      if (event.type === 'plan.step_completed') setTrace(`${event.data.result.tool_name}: ${event.data.result.success ? 'complete' : 'failed'}`);
      if (event.type === 'chat.completed') { appendResponse(event.data); socket.close(); unsubscribe(); }
      if (event.type === 'error') { setError(event.data.message); setIsWorking(false); socket.close(); unsubscribe(); }
    });
    try {
      await socket.connect();
      socket.sendChat({ requestId: `mobile-${Date.now()}`, message, sessionId: mobileSessionId });
    } catch {
      try { appendResponse(await clientResult.client.chat({ message, session_id: mobileSessionId })); }
      catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Noa could not be reached.'); setIsWorking(false); }
      finally { socket.close(); unsubscribe(); }
    }
  };

  if (clientResult.error) return <Screen><SetupNotice message={clientResult.error} /></Screen>;
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', default: undefined })}><Screen>
    <View style={styles.header}><Text style={styles.eyebrow}>NOA / MOBILE SESSION</Text><Text style={styles.title}>Command stream</Text></View>
    <FlatList data={messages} style={styles.list} contentContainerStyle={styles.listContent} keyExtractor={(item) => item.id} renderItem={({ item }) => <View style={[styles.message, item.role === 'user' ? styles.userMessage : styles.assistantMessage]}><Text style={styles.messageRole}>{item.role === 'user' ? 'YOU' : 'NOA'}</Text><Text style={styles.messageContent}>{item.content}</Text>{item.planStatus && <Text style={styles.planStatus}>{item.planStatus}</Text>}</View>} />
    {(trace || error) && <View style={error ? styles.errorTrace : styles.trace}><Text style={styles.traceText}>{error || trace}</Text></View>}
    <View style={styles.composer}><TextInput value={input} onChangeText={setInput} placeholder="Give Noa a goal…" placeholderTextColor="#7d978d" multiline style={styles.input} editable={!isWorking} /><Pressable onPress={send} style={[styles.send, isWorking && styles.disabled]} disabled={isWorking}>{isWorking ? <ActivityIndicator color="#102018" /> : <Text style={styles.sendText}>Send</Text>}</Pressable></View>
  </Screen></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#07110f' }, header: { paddingBottom: 14 }, eyebrow: { color: '#c9f670', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }, title: { color: '#ecf7f1', fontSize: 30, fontWeight: '700', marginTop: 5 }, list: { flex: 1 }, listContent: { gap: 10, paddingBottom: 12 }, message: { maxWidth: '88%', borderRadius: 16, padding: 13 }, userMessage: { alignSelf: 'flex-end', backgroundColor: '#c9f670' }, assistantMessage: { alignSelf: 'flex-start', backgroundColor: '#142923', borderWidth: 1, borderColor: '#29453b' }, messageRole: { color: '#718d82', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 }, messageContent: { color: '#ecf7f1', fontSize: 15, lineHeight: 21 }, planStatus: { color: '#75e6da', fontSize: 11, fontWeight: '700', marginTop: 8, textTransform: 'uppercase' }, trace: { backgroundColor: '#10251f', borderLeftWidth: 2, borderLeftColor: '#75e6da', padding: 9, marginBottom: 9 }, errorTrace: { backgroundColor: '#35201f', borderLeftWidth: 2, borderLeftColor: '#ffaaa6', padding: 9, marginBottom: 9 }, traceText: { color: '#d4e9df', fontSize: 12 }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, borderWidth: 1, borderColor: '#2d4b40', borderRadius: 16, padding: 10, backgroundColor: '#0d201b' }, input: { flex: 1, maxHeight: 100, color: '#ecf7f1', fontSize: 16, paddingVertical: 7 }, send: { backgroundColor: '#c9f670', borderRadius: 11, paddingHorizontal: 15, paddingVertical: 12 }, disabled: { opacity: 0.55 }, sendText: { color: '#102018', fontWeight: '800' },
});
