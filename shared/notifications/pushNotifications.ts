import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const TRAINING_HOURS = [9, 11, 13, 15, 17, 19];
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export async function registerForPushNotifications(userId: string) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  const { error } = await supabase.from('user_push_tokens').upsert(
    { user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,token' }
  );

  if (error) console.warn('Push token storage failed:', error.message);

  return token;
}

export async function sendPushToAudience(params: { title: string; body: string; audience: string[]; data?: Record<string, unknown> }) {
  const { data, error } = await supabase.from('user_push_tokens').select('token, user_profiles!inner(role)');
  if (error || !data) throw new Error(error?.message || 'No se pudieron cargar tokens push.');

  const targets = new Set(params.audience.map((a) => a.toLowerCase()));
  const shouldAll = targets.has('all');

  const messages = data
    .filter((row: any) => {
      if (shouldAll) return true;
      const role = (row.user_profiles?.role || '').toLowerCase();
      if (targets.has('administradores') && role === 'administrador') return true;
      if (targets.has('entrenadores') && role === 'entrenador') return true;
      return targets.has('estudiantes') && (role === 'estudiante' || role === 'usuario');
    })
    .map((row: any) => ({ to: row.token, sound: 'default', title: params.title, body: params.body, data: params.data || {} }));

  if (!messages.length) return;

  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
}

export async function bootstrapCategoryTrainingReminders(userId: string) {
  await clearScheduledTrainingReminders();

  const { data: studentData } = await supabase
    .from('students')
    .select('category, user_id, profile_id')
    .or(`user_id.eq.${userId},profile_id.eq.${userId}`)
    .limit(1)
    .maybeSingle();

  const category = studentData?.category;
  if (!category) return;

  const { data: schedules } = await supabase
    .from('schedules')
    .select('id, day_of_week, start_time, end_time, category')
    .eq('category', category);

  if (!schedules?.length) return;

  for (const schedule of schedules) {
    const dayIndex = Math.max(0, DAYS.indexOf(String(schedule.day_of_week || '').toLowerCase()));
    for (const hour of TRAINING_HOURS) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de entrenamiento',
          body: `Hoy tienes entrenamiento de ${category} (${schedule.start_time}-${schedule.end_time}).`,
          data: { type: 'training_reminder', scheduleId: schedule.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: dayIndex + 1, hour, minute: 0 },
      });
    }
  }
}

export async function clearScheduledTrainingReminders() {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  const ids = notifications.filter((item) => item.content.data?.type === 'training_reminder').map((item) => item.identifier);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
