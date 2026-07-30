import { StyleSheet, Text, View } from 'react-native';

export function SetupNotice({ message }: { message: string }) {
  return <View style={styles.box}><Text style={styles.title}>Backend configuration needed</Text><Text style={styles.message}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: '#ffb86c', backgroundColor: '#2b2113', borderRadius: 12, padding: 14 },
  title: { color: '#ffcf9a', fontWeight: '700', marginBottom: 4 },
  message: { color: '#f6dfc7', lineHeight: 20 },
});
