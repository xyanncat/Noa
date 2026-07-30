import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { syncPendingMemory, type MemorySnapshot } from '@noa/api-client';
import { SetupNotice } from '@/components/SetupNotice';
import { Screen } from '@/components/Screen';
import { getNoaClient, mobileSessionId } from '@/lib/noa';
import { memoryOutbox, queueMemory } from '@/lib/offline-memory';

export default function MemoryScreen() {
  const clientResult = useMemo(() => { try { return { client: getNoaClient() }; } catch (error) { return { error: error instanceof Error ? error.message : 'Backend is not configured.' }; } }, []);
  const [snapshot, setSnapshot] = useState<MemorySnapshot>();
  const [subject, setSubject] = useState('');
  const [fact, setFact] = useState('');
  const [layer, setLayer] = useState<'long_term' | 'semantic'>('long_term');
  const [status, setStatus] = useState('Load current session memory to begin.');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!clientResult.client) return;
    setLoading(true);
    try { setSnapshot(await clientResult.client.memory(mobileSessionId)); setStatus('Memory synchronized from Noa.'); }
    catch { setStatus('Backend unreachable. New explicit memory entries can be queued offline.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);

  const save = async () => {
    if (!subject.trim() || !fact.trim()) return;
    const payload = { layer, category_or_subject: subject.trim(), key_or_fact: fact.trim(), value: fact.trim() } as const;
    try {
      if (!clientResult.client) throw new Error('Backend unavailable');
      await clientResult.client.addMemory(payload);
      setStatus('Memory saved to Noa.');
      await refresh();
    } catch {
      await queueMemory(payload);
      setStatus('Saved to the local outbox. Tap Sync after Noa is reachable.');
    }
    setSubject(''); setFact('');
  };

  const sync = async () => {
    if (!clientResult.client) return;
    setLoading(true);
    const result = await syncPendingMemory(clientResult.client, memoryOutbox);
    setStatus(`${result.synced.length} queued entries synced; ${result.failed.length} still pending.`);
    await refresh();
    setLoading(false);
  };

  if (clientResult.error) return <Screen><SetupNotice message={clientResult.error} /></Screen>;
  return <Screen><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>5-LAYER MEMORY</Text><Text style={styles.title}>Memory deck</Text><Text style={styles.caption}>The outbox replays only explicit memory writes. Chats, tools, and autonomous actions are never replayed offline.</Text>
    <View style={styles.form}><View style={styles.layerRow}><Pressable style={[styles.layer, layer === 'long_term' && styles.layerActive]} onPress={() => setLayer('long_term')}><Text style={styles.layerText}>Preference</Text></Pressable><Pressable style={[styles.layer, layer === 'semantic' && styles.layerActive]} onPress={() => setLayer('semantic')}><Text style={styles.layerText}>Fact</Text></Pressable></View><TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Preference key or subject" placeholderTextColor="#7d978d"/><TextInput style={styles.input} value={fact} onChangeText={setFact} placeholder="Value or verified fact" placeholderTextColor="#7d978d"/><Pressable style={styles.primary} onPress={save}><Text style={styles.primaryText}>Save explicit memory</Text></Pressable></View>
    <View style={styles.statusRow}><Text style={styles.status}>{status}</Text><Pressable onPress={sync} disabled={loading}>{loading ? <ActivityIndicator color="#c9f670"/> : <Text style={styles.sync}>Sync outbox</Text>}</Pressable></View>
    <MemoryCard title="Working" lines={snapshot?.working.history.map((item) => `${item.role}: ${item.content}`) ?? []}/><MemoryCard title="Short-term" lines={snapshot?.short_term.recent_tasks.map((item) => `${String(item.key)}: ${String(item.value)}`) ?? []}/><MemoryCard title="Long-term" lines={snapshot?.long_term.map((item) => `${String(item.key)}: ${String(item.value)}`) ?? []}/><MemoryCard title="Semantic" lines={snapshot?.semantic.map((item) => `${String(item.subject)}: ${String(item.fact)}`) ?? []}/><MemoryCard title="Episodic" lines={snapshot?.episodic.map((item) => `${String(item.event_type)}: ${String(item.summary)}`) ?? []}/>
  </ScrollView></Screen>;
}

function MemoryCard({ title, lines }: { title: string; lines: string[] }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{lines.length ? lines.slice(0, 8).map((line, index) => <Text style={styles.line} key={`${title}-${index}`}>{line}</Text>) : <Text style={styles.empty}>No entries in this layer.</Text>}</View>;
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 30 }, eyebrow: { color: '#c9f670', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }, title: { color: '#ecf7f1', fontSize: 30, fontWeight: '700' }, caption: { color: '#9bb5aa', lineHeight: 20 }, form: { gap: 9, backgroundColor: '#10251f', borderWidth: 1, borderColor: '#2d4b40', borderRadius: 14, padding: 12 }, layerRow: { flexDirection: 'row', gap: 8 }, layer: { flex: 1, borderWidth: 1, borderColor: '#45695c', borderRadius: 9, padding: 9, alignItems: 'center' }, layerActive: { backgroundColor: '#c9f670', borderColor: '#c9f670' }, layerText: { color: '#ecf7f1', fontWeight: '700' }, input: { borderWidth: 1, borderColor: '#2d4b40', borderRadius: 9, backgroundColor: '#07110f', color: '#ecf7f1', padding: 10 }, primary: { backgroundColor: '#c9f670', borderRadius: 9, padding: 11, alignItems: 'center' }, primaryText: { color: '#102018', fontWeight: '800' }, statusRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' }, status: { flex: 1, color: '#9bb5aa', fontSize: 12 }, sync: { color: '#75e6da', fontWeight: '800' }, card: { borderWidth: 1, borderColor: '#29453b', borderRadius: 14, padding: 12, backgroundColor: '#0d201b' }, cardTitle: { color: '#75e6da', fontWeight: '800', marginBottom: 7 }, line: { color: '#cfdfd7', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#1c342c', fontSize: 12 }, empty: { color: '#728d82', fontSize: 12 },
});
