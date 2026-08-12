import { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PhotoPickerModal } from '@/components/PhotoPickerModal';
import { useTheme } from '@/providers/ThemeProvider';
import { useTodaySession } from '@/hooks/useTodaySession';
import type { Reminder } from '@/types/session';

export default function Home() {
  const theme = useTheme();
  const {
    session,
    loading,
    refreshing,
    syncing,
    nextReminder,
    refresh,
    handleCheckIn,
    handleCheckout,
    handleCompleteReminder,
    handleAttachPhoto,
  } = useTodaySession();

  const [photoModalReminderId, setPhotoModalReminderId] = useState<string | null>(null);

  const openCampusLifeApp = async () => {
    const url = process.env.EXPO_PUBLIC_CAMPUS_LIFE_APP_URL;
    if (url) {
      const can = await Linking.canOpenURL(url).catch(() => false);
      if (can) {
        await Linking.openURL(url);
        return;
      }
    }
    Alert.alert(
      'Open Official App',
      'Please open the official Campus Life app on your device to perform your official VTU check-in or checkout.',
      [{ text: 'OK' }]
    );
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = (isoString?: string | null, fallbackTime?: string) => {
    if (isoString) {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (fallbackTime) {
      const [h, m] = fallbackTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return '--:--';
  };

  const calculatedHoursText = () => {
    if (!session) return '0h 0m';
    if (session.totalMinutes) {
      const h = Math.floor(session.totalMinutes / 60);
      const m = session.totalMinutes % 60;
      return `${h}h ${m}m`;
    }
    if (session.checkInCompletedAt) {
      const start = new Date(session.checkInCompletedAt).getTime();
      const end = session.checkoutCompletedAt ? new Date(session.checkoutCompletedAt).getTime() : Date.now();
      const mins = Math.max(0, Math.round((end - start) / 60000));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return '0h 0m';
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.text} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: theme.text }]}>{getGreeting()}</Text>
            <Text style={[styles.date, { color: theme.secondary }]}>{formattedDate}</Text>
          </View>
          {syncing && (
            <View style={[styles.syncBadge, { borderColor: theme.border }]}>
              <Text style={[styles.syncText, { color: theme.secondary }]}>SYNCING...</Text>
            </View>
          )}
        </View>

        {/* Today's Campus Life Day Status */}
        <Card style={styles.cardSpacing}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.secondary }]}>CAMPUS LIFE</Text>
            <Text style={[styles.badge, { color: theme.text, borderColor: theme.border }]}>
              {session ? session.status.replace('_', ' ') : 'NO SESSION'}
            </Text>
          </View>
          <Text style={[styles.hours, { color: theme.text }]}>
            {session ? `${formatTime(null, session.scheduledStart)} — ${formatTime(null, session.scheduledEnd)}` : 'No Schedule Today'}
          </Text>
          <Text style={[styles.muted, { color: theme.secondary }]}>
            {session
              ? `Check-in: ${session.checkInStatus === 'COMPLETED' ? 'Completed' : 'Pending'} · Checkout: ${session.checkoutStatus === 'COMPLETED' ? 'Completed' : 'Pending'}`
              : 'Today is not set as a Campus Life day in your schedule settings.'}
          </Text>
        </Card>

        {/* Next Reminder Card */}
        <Text style={[styles.section, { color: theme.text }]}>NEXT REMINDER</Text>
        {nextReminder ? (
          <Card style={styles.cardSpacing}>
            <Text style={[styles.reminderTime, { color: theme.text }]}>{formatTime(nextReminder.scheduledAt)}</Text>
            <Text style={[styles.reminderTitle, { color: theme.text }]}>
              {nextReminder.type === 'CHECK_IN'
                ? 'Check in'
                : nextReminder.type === 'CHECKOUT'
                ? 'Check out'
                : nextReminder.type === 'CHECKOUT_WARNING'
                ? 'Checkout warning'
                : 'Activity / photo'}
            </Text>
            <Text style={[styles.muted, { color: theme.secondary }]}>
              {nextReminder.type === 'CHECK_IN'
                ? 'Remember to check in with the official Campus Life app.'
                : nextReminder.type === 'CHECKOUT'
                ? 'Complete your official checkout before leaving.'
                : 'Confirm your activity and optional photo log.'}
            </Text>

            {nextReminder.type === 'CHECK_IN' && session?.checkInStatus !== 'COMPLETED' && (
              <View style={styles.actionGap}>
                <Button label="Mark Checked In" onPress={handleCheckIn} style={styles.button} />
                <Button label="Open Campus Life App" secondary onPress={openCampusLifeApp} style={styles.button} />
              </View>
            )}

            {nextReminder.type === 'CHECKOUT' && session?.checkoutStatus !== 'COMPLETED' && (
              <View style={styles.actionGap}>
                <Button label="Mark Checked Out" onPress={handleCheckout} style={styles.button} />
                <Button label="Open Campus Life App" secondary onPress={openCampusLifeApp} style={styles.button} />
              </View>
            )}

            {nextReminder.type === 'ACTIVITY' && (
              <View style={styles.actionGap}>
                <Button
                  label="Attach Photo & Complete"
                  onPress={() => setPhotoModalReminderId(nextReminder.id)}
                  style={styles.button}
                />
                <Button
                  label="Complete Activity"
                  secondary
                  onPress={() => handleCompleteReminder(nextReminder.id)}
                  style={styles.button}
                />
              </View>
            )}

            {(nextReminder.type === 'CHECKOUT_WARNING' || nextReminder.type === 'STAYING') && (
              <Button
                label="Acknowledge"
                secondary
                onPress={() => handleCompleteReminder(nextReminder.id)}
                style={styles.button}
              />
            )}
          </Card>
        ) : (
          <Card style={styles.cardSpacing}>
            <Text style={[styles.reminderTime, { color: theme.text }]}>✓ All Clear</Text>
            <Text style={[styles.muted, { color: theme.secondary }]}>
              No pending reminders right now. All scheduled actions are up to date.
            </Text>
            <Button label="Open Campus Life App" secondary onPress={openCampusLifeApp} style={styles.button} />
          </Card>
        )}

        {/* Today's Timeline */}
        <Text style={[styles.section, { color: theme.text }]}>TODAY'S TIMELINE</Text>
        <View style={[styles.timeline, { borderColor: theme.border }]}>
          {session && session.reminders.length > 0 ? (
            session.reminders.map((r: Reminder) => (
              <View key={r.id} style={[styles.event, { borderColor: theme.border }]}>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTime, { color: theme.text }]}>{formatTime(r.scheduledAt)}</Text>
                  <Text style={[styles.muted, { color: theme.secondary }]}>
                    {r.type.replace('_', ' ')}
                  </Text>

                  {/* Attached photo preview if present */}
                  {r.confirmation?.photo?.imageUrl && (
                    <View style={styles.photoContainer}>
                      <Image source={{ uri: r.confirmation.photo.imageUrl }} style={styles.photoThumb} />
                      <Text style={[styles.photoLabel, { color: theme.secondary }]}>Attached Photo</Text>
                    </View>
                  )}
                </View>

                <View style={styles.eventStatusCol}>
                  <Text style={[styles.eventStatus, { color: r.status === 'COMPLETED' ? theme.text : theme.secondary }]}>
                    {r.status}
                  </Text>
                  {r.status === 'PENDING' && r.type === 'ACTIVITY' && (
                    <Button
                      label="Attach Photo"
                      secondary
                      onPress={() => setPhotoModalReminderId(r.id)}
                      style={styles.miniBtn}
                    />
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.event, { borderColor: theme.border }]}>
              <Text style={[styles.muted, { color: theme.secondary }]}>No reminders generated yet.</Text>
            </View>
          )}
        </View>

        {/* Today's Hours Card */}
        <Card style={styles.cardSpacing}>
          <Text style={[styles.label, { color: theme.secondary }]}>TODAY'S HOURS</Text>
          <Text style={[styles.total, { color: theme.text }]}>{calculatedHoursText()}</Text>
          <Text style={[styles.muted, { color: theme.secondary }]}>
            Active recorded time today based on check-in and checkout confirmations.
          </Text>
        </Card>

        <Button label="Update schedule" secondary onPress={() => router.push('/schedule')} style={styles.bottomSpace} />
      </ScrollView>

      {/* Photo Picker Modal */}
      <PhotoPickerModal
        visible={Boolean(photoModalReminderId)}
        onClose={() => setPhotoModalReminderId(null)}
        onConfirmPhoto={(url) => {
          if (photoModalReminderId) {
            handleAttachPhoto(photoModalReminderId, url);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7 },
  date: { fontSize: 15, marginTop: 4, marginBottom: 20 },
  syncBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  syncText: { fontSize: 10, fontWeight: '800' },
  cardSpacing: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, letterSpacing: 0.8, fontWeight: '800' },
  badge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4, fontSize: 10, fontWeight: '800' },
  hours: { fontSize: 21, fontWeight: '800', marginTop: 14 },
  muted: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginTop: 20, marginBottom: 10 },
  reminderTime: { fontSize: 25, fontWeight: '800' },
  reminderTitle: { fontSize: 17, fontWeight: '700', marginTop: 6 },
  button: { marginTop: 10 },
  actionGap: { marginTop: 8 },
  timeline: { borderTopWidth: 1, marginVertical: 8 },
  event: { paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventInfo: { flex: 1, paddingRight: 10 },
  eventTime: { fontSize: 15, fontWeight: '700' },
  eventStatusCol: { alignItems: 'flex-end' },
  eventStatus: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  photoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  photoThumb: { width: 44, height: 44, borderRadius: 6, borderWidth: 1, borderColor: '#DDD' },
  photoLabel: { fontSize: 11, fontWeight: '600' },
  miniBtn: { marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, minHeight: 32 },
  total: { fontSize: 27, fontWeight: '800', marginTop: 8, marginBottom: 2 },
  bottomSpace: { marginTop: 16, marginBottom: 40 },
});
