import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as Speech from 'expo-speech';
import { SetupNotice } from '@/components/SetupNotice';
import { Screen } from '@/components/Screen';
import { getNoaClient } from '@/lib/noa';

async function uriToBase64(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the local recording.'));
    reader.onloadend = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',', 2)[1] : result);
    };
    reader.readAsDataURL(blob);
  });
}

export default function VoiceScreen() {
  const clientResult = useMemo(() => { try { return { client: getNoaClient() }; } catch (error) { return { error: error instanceof Error ? error.message : 'Backend is not configured.' }; } }, []);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [status, setStatus] = useState('Request microphone permission to begin.');
  const [transcript, setTranscript] = useState('');

  useEffect(() => { void (async () => { const permission = await AudioModule.requestRecordingPermissionsAsync(); if (permission.granted) { await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }); setStatus('Ready to record a short request.'); } })(); }, []);

  const toggleRecording = async () => {
    try {
      if (!recorderState.isRecording) {
        await recorder.prepareToRecordAsync();
        recorder.record();
        setStatus('Listening… tap again to stop and send for transcription.');
        return;
      }
      await recorder.stop();
      if (!recorder.uri || !clientResult.client) return;
      setStatus('Uploading audio to Noa…');
      const result = await clientResult.client.transcribeAudio({ audio_base64: await uriToBase64(recorder.uri), mime_type: 'audio/m4a' });
      setTranscript(result.transcript);
      setStatus(result.transcription_mode === 'stub' ? 'Audio upload works. Configure a real ASR provider to replace the current stub transcript.' : 'Transcription complete.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Voice recording failed.');
    }
  };

  if (clientResult.error) return <Screen><SetupNotice message={clientResult.error} /></Screen>;
  return <Screen><View style={styles.container}><Text style={styles.eyebrow}>NATIVE AUDIO</Text><Text style={styles.title}>Voice assistant</Text><Text style={styles.caption}>Record on-device audio, send it to Noa’s transcription endpoint, then use device text-to-speech for the response.</Text><View style={[styles.orb, recorderState.isRecording && styles.orbActive]}><Text style={styles.orbText}>{recorderState.isRecording ? 'REC' : 'VOICE'}</Text></View><Pressable style={styles.record} onPress={toggleRecording}><Text style={styles.recordText}>{recorderState.isRecording ? 'Stop & transcribe' : 'Start recording'}</Text></Pressable><Text style={styles.status}>{status}</Text>{transcript ? <View style={styles.transcript}><Text style={styles.transcriptLabel}>TRANSCRIPT</Text><Text style={styles.transcriptText}>{transcript}</Text><Pressable style={styles.speak} onPress={() => Speech.speak(transcript)}><Text style={styles.speakText}>Speak on device</Text></Pressable></View> : null}</View></Screen>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: 14 }, eyebrow: { alignSelf: 'stretch', color: '#c9f670', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }, title: { alignSelf: 'stretch', color: '#ecf7f1', fontSize: 30, fontWeight: '700' }, caption: { color: '#9bb5aa', lineHeight: 20 }, orb: { width: 150, height: 150, marginTop: 24, borderRadius: 75, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16322a', borderWidth: 2, borderColor: '#45695c' }, orbActive: { backgroundColor: '#c9f670', borderColor: '#ecf7f1' }, orbText: { color: '#ecf7f1', fontWeight: '800', letterSpacing: 2 }, record: { backgroundColor: '#c9f670', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }, recordText: { color: '#102018', fontWeight: '800' }, status: { textAlign: 'center', color: '#9bb5aa', lineHeight: 19 }, transcript: { alignSelf: 'stretch', borderWidth: 1, borderColor: '#2d4b40', backgroundColor: '#10251f', borderRadius: 14, padding: 14, gap: 8 }, transcriptLabel: { color: '#75e6da', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }, transcriptText: { color: '#e5f0eb', lineHeight: 21 }, speak: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#75e6da', borderRadius: 8, padding: 8 }, speakText: { color: '#75e6da', fontWeight: '700' },
});
