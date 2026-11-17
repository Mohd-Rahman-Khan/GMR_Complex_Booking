import { StyleSheet } from 'react-native';

export const GREEN = '#14532D';
export const LIME = '#A3E635';
export const BG = '#F4F7F4';
export const TEXT = '#17231B';
export const MUTED = '#68766C';
export const BORDER = '#E1E9E2';

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingBottom: 36 },
  header: { backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '800' },
  headerSub: { color: '#D1FAE5', fontSize: 13, marginTop: 5 },
  sectionTitle: { color: TEXT, fontSize: 17, fontWeight: '800', marginTop: 22, marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 15, marginBottom: 12 },
  title: { color: TEXT, fontSize: 15, fontWeight: '800' },
  sub: { color: MUTED, fontSize: 12, marginTop: 5, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  button: { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  secondaryButton: { backgroundColor: '#EAF5EC', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  secondaryText: { color: GREEN, fontWeight: '800', fontSize: 12 },
  input: { backgroundColor: '#FFFFFF', borderColor: BORDER, borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, color: TEXT, fontSize: 14, marginTop: 6 },
  label: { color: TEXT, fontSize: 12, fontWeight: '700', marginTop: 14 },
  pill: { backgroundColor: '#EAF5EC', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  pillText: { color: GREEN, fontSize: 10, fontWeight: '800' },
  stat: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, borderColor: BORDER, borderWidth: 1, marginBottom: 10 },
  statValue: { fontSize: 23, color: GREEN, fontWeight: '900' },
  statLabel: { fontSize: 11, color: MUTED, marginTop: 4 },
});
