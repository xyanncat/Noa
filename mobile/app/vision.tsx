import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SetupNotice } from '@/components/SetupNotice';
import { Screen } from '@/components/Screen';
import { getNoaClient } from '@/lib/noa';

export default function VisionScreen() {
  const clientResult = useMemo(() => { try { return { client: getNoaClient() }; } catch (error) { return { error: error instanceof Error ? error.message : 'Backend is not configured.' }; } }, []);
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [result, setResult] = useState<string>();

  const capture = async () => {
    if (!cameraRef.current || !clientResult.client) return;
    setIsAnalyzing(true); setResult(undefined);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.45 });
      if (!photo.base64) throw new Error('The camera did not return image data.');
      setPreview(photo.uri);
      const analysis = await clientResult.client.analyzeImage({ image_data: photo.base64, prompt: 'Read visible text and describe the important visual information.' });
      setResult(`${analysis.description}\n\nDetected: ${analysis.detected_objects.join(', ')}`);
    } catch (error) { setResult(error instanceof Error ? error.message : 'Vision request failed.'); }
    finally { setIsAnalyzing(false); }
  };

  if (clientResult.error) return <Screen><SetupNotice message={clientResult.error} /></Screen>;
  if (!permission) return <Screen><ActivityIndicator color="#c9f670" /></Screen>;
  if (!permission.granted) return <Screen><View style={styles.center}><Text style={styles.title}>Camera access is required</Text><Text style={styles.caption}>Noa only sends a photo after you explicitly capture it.</Text><Pressable style={styles.primary} onPress={requestPermission}><Text style={styles.primaryText}>Grant camera permission</Text></Pressable></View></Screen>;
  return <Screen><View style={styles.container}><Text style={styles.eyebrow}>DEVICE CAMERA</Text><Text style={styles.title}>Vision capture</Text><Text style={styles.caption}>Capture a photo to send base64 image data to Noa Vision. The current backend is a vision stub until a multimodal provider is connected.</Text><View style={styles.cameraFrame}><CameraView ref={cameraRef} style={styles.camera} facing="back" /></View><Pressable style={styles.primary} onPress={capture} disabled={isAnalyzing}>{isAnalyzing ? <ActivityIndicator color="#102018" /> : <Text style={styles.primaryText}>Capture & analyze</Text>}</Pressable>{preview ? <Image source={{ uri: preview }} style={styles.preview} /> : null}{result ? <View style={styles.result}><Text style={styles.resultLabel}>NOA VISION</Text><Text style={styles.resultText}>{result}</Text></View> : null}</View></Screen>;
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12 }, center: { flex: 1, justifyContent: 'center', gap: 14 }, eyebrow: { color: '#c9f670', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }, title: { color: '#ecf7f1', fontSize: 30, fontWeight: '700' }, caption: { color: '#9bb5aa', lineHeight: 20 }, cameraFrame: { flex: 1, minHeight: 270, overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: '#45695c' }, camera: { flex: 1 }, primary: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: '#c9f670', borderRadius: 12, padding: 14 }, primaryText: { color: '#102018', fontWeight: '800' }, preview: { width: 88, height: 88, borderRadius: 10, alignSelf: 'flex-end' }, result: { borderWidth: 1, borderColor: '#2d4b40', backgroundColor: '#10251f', borderRadius: 14, padding: 13 }, resultLabel: { color: '#75e6da', fontWeight: '800', fontSize: 11, letterSpacing: 1.2, marginBottom: 5 }, resultText: { color: '#e5f0eb', lineHeight: 20 },
});
