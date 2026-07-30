import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView, StatusBar, ActivityIndicator 
} from 'react-native';

const API_BASE = "http://192.168.1.12:8000/api";

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I am Noa. I am connected via your local network. How can I help you today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState('Connecting...');

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(data => setHealthStatus(`Online (${data.tools_count} tools)`))
      .catch(() => setHealthStatus('Offline / Reconnecting'));
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;
    const text = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: 'mobile_session' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Network Error: Could not reach Noa Backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.orbBadge}>
            <Text style={styles.orbText}>✦</Text>
          </View>
          <View>
            <Text style={styles.title}>Noa Mobile</Text>
            <Text style={styles.subtitle}>Status: {healthStatus}</Text>
          </View>
        </View>
      </View>

      {/* Chat Stream */}
      <ScrollView style={styles.chatContainer} contentContainerStyle={{ padding: 16 }}>
        {messages.map((m, idx) => (
          <View 
            key={idx} 
            style={[
              styles.messageBubble, 
              m.role === 'user' ? styles.userBubble : styles.assistantBubble
            ]}
          >
            <Text style={m.role === 'user' ? styles.userText : styles.assistantText}>
              {m.content}
            </Text>
          </View>
        ))}
        {loading && <ActivityIndicator color="#c084fc" style={{ marginVertical: 10 }} />}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask Noa anything..."
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#1e293b',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orbBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  chatContainer: {
    flex: 1,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#7c3aed',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userText: {
    color: '#ffffff',
    fontSize: 15,
  },
  assistantText: {
    color: '#f8fafc',
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0f172a',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#a855f7',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
