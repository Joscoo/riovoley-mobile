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
const PAYMENT_REMINDER_TYPE = 'payment_membership_reminder';

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

const toDateOnly = (isoLike: string) => new Date(`${String(isoLike).slice(0, 10)}T00:00:00`);

const dateDiffInDays = (end: Date, start: Date) =>
  Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

async function resolvePaymentsOwnerMode(): Promise<'user' | 'student' | null> {
  const byUser = await supabase.from('payments').select('id,user_id').limit(1);
  if (!byUser.error) return 'user';
  const byStudent = await supabase.from('payments').select('id,student_id').limit(1);
  if (!byStudent.error) return 'student';
  return null;
}

export async function clearScheduledPaymentReminders() {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  const ids = notifications
    .filter((item) => item.content.data?.type === PAYMENT_REMINDER_TYPE)
    .map((item) => item.identifier);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function bootstrapPaymentReminders(userId: string) {
  await clearScheduledPaymentReminders();

  const ownerMode = await resolvePaymentsOwnerMode();
  if (!ownerMode) return;

  let dueDate: string | null = null;

  if (ownerMode === 'user') {
    const { data } = await supabase
      .from('payments')
      .select('due_date,period_end,payment_date')
      .eq('user_id', userId)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    dueDate = data?.period_end || data?.due_date || data?.payment_date || null;
  } else {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!student?.id) return;

    const { data } = await supabase
      .from('payments')
      .select('due_date,period_end,payment_date')
      .eq('student_id', student.id)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    dueDate = data?.period_end || data?.due_date || data?.payment_date || null;
  }

  if (!dueDate) return;

  const now = new Date();
  const due = toDateOnly(dueDate);
  const daysRemaining = dateDiffInDays(due, now);

  if (daysRemaining > 5) return;

  const scheduleAtMidnight = async (targetDate: Date, body: string) => {
    if (targetDate.getTime() <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Estado de membresía',
        body,
        data: { type: PAYMENT_REMINDER_TYPE },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });
  };

  // Próximo a vencer: notificación diaria 12:00 AM dentro de ventana de 5 días.
  for (let i = Math.max(daysRemaining, 0); i >= 0; i -= 1) {
    const target = new Date(due);
    target.setDate(due.getDate() - i);
    target.setHours(0, 0, 0, 0);
    await scheduleAtMidnight(target, `Tu membresía vence en ${i} día(s).`);
  }

  // Primer día vencido: 12:00 AM del día siguiente a la fecha fin.
  const firstOverdue = new Date(due);
  firstOverdue.setDate(due.getDate() + 1);
  firstOverdue.setHours(0, 0, 0, 0);
  await scheduleAtMidnight(firstOverdue, 'Tu membresía venció hoy. Registra tu próximo pago.');
}
