import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useTheme } from '@/providers/ThemeProvider';
import { useSessionHistory } from '@/hooks/useSessionHistory';

const FILTERS: Array<{ id: 'today' | 'week' | 'month' | 'all'; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All' },
];

export default function History() {
  const theme = useTheme();
  const { filter, setFilter, stats, sessions, loading, refreshing, refresh } = useSessionHistory();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMinutes = (mins?: number | null) => {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.text} />}
      >
        <Text style={[styles.title, { color: theme.text }]}>History</Text>
        <Text style={[styles.sub, { color: theme.secondary }]}>Your completed Campus Life records.</Text>

        {/* Filter Chips */}
        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[
                  styles.filter,
                  {
                    backgroundColor: active ? theme.primary : theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? theme.background : theme.text,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Calculated Stats Summary */}
        <View style={styles.summary}>
          <Stat value={stats.totalHours} label="Total hours" />
          <Stat value={String(stats.completedDays)} label="Completed days" />
          <Stat value={stats.checkoutRate} label="Checkout rate" />
        </View>

        <Text style={[styles.month, { color: theme.text }]}>RECORDS ({sessions.length})</Text>

        {/* Session List */}
        {sessions.length > 0 ? (
          sessions.map((s) => {
            const completedReminders = s.reminders ? s.reminders.filter((r) => r.status === 'COMPLETED').length : 0;
            const totalReminders = s.reminders ? s.reminders.length : 0;

            return (
              <Card key={s.id} style={styles.cardSpace}>
                <View style={styles.row}>
                  <View style={styles.dateCol}>
                    <Text style={[styles.day, { color: theme.text }]}>{formatDate(s.date)}</Text>
                    <Text style={[styles.detail, { color: theme.secondary }]}>
                      {s.scheduledStart} — {s.scheduledEnd} · {completedReminders}/{totalReminders} done
                    </Text>
                  </View>
                  <Text style={[styles.hours, { color: theme.text }]}>{formatMinutes(s.totalMinutes)}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={[styles.status, { color: theme.secondary }]}>{s.status.replace('_', ' ')}</Text>
                  {s.checkInCompletedAt && (
                    <Text style={[styles.checkBadge, { color: theme.secondary }]}>✓ Checked in</Text>
                  )}
                  {s.checkoutCompletedAt && (
                    <Text style={[styles.checkBadge, { color: theme.secondary }]}>✓ Checked out</Text>
                  )}
                </View>
              </Card>
            );
          })
        ) : (
          <Card style={styles.cardSpace}>
            <Text style={[styles.day, { color: theme.text }]}>No Sessions Found</Text>
            <Text style={[styles.detail, { color: theme.secondary }]}>
              {loading ? 'Loading records...' : 'No Campus Life history for the selected filter period.'}
            </Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.secondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7 },
  sub: { fontSize: 16, marginTop: 7 },
  filters: { flexDirection: 'row', gap: 7, marginTop: 25, marginBottom: 23 },
  filter: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statValue: { fontSize: 23, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 3 },
  month: { fontSize: 12, letterSpacing: 0.8, fontWeight: '800', marginBottom: 10 },
  cardSpace: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dateCol: { flex: 1, paddingRight: 10 },
  day: { fontSize: 16, fontWeight: '800' },
  detail: { fontSize: 13, marginTop: 4 },
  hours: { fontWeight: '800', fontSize: 16 },
  statusRow: { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' },
  status: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  checkBadge: { fontSize: 11, fontWeight: '600' },
});
