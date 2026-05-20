/**
 * Home service - Supabase queries
 */

import { supabase } from '@/lib/supabase';
import { HomeAnnouncement, HomeTraining, HomeAttendance, HomePayment } from '../types/home.types';

export const homeService = {
  // User Profile
  async fetchUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  // Announcements
  async fetchAnnouncements(limit = 5): Promise<HomeAnnouncement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }

    return data ?? [];
  },

  // Next Training/Schedule
  async fetchNextTraining(userId: string): Promise<HomeTraining | null> {
    // TODO: filtrar por categoría, rol o grupo del usuario cuando esté disponible.
    // This query depends on your actual schema
    // Assuming there's a relationship between user_profiles and schedules
    const { data, error } = await supabase
      .from('schedules')
      .select('id, category, day_of_week, start_time, end_time, location')
      .order('start_time', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error fetching next training:', error);
      return null;
    }

    return data?.[0] ?? null;
  },

  // Attendance Status
  async fetchAttendanceStatus(userId: string): Promise<HomeAttendance | null> {
    const { data, error } = await supabase
      .from('attendances')
      .select('attended')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching attendance:', error);
      return null;
    }

    const total = data?.length ?? 0;
    const attended = data?.filter((a) => a.attended).length ?? 0;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

    return {
      attended: attended > 0,
      percentage,
    };
  },

  // Payment Status
  async fetchPaymentStatus(userId: string): Promise<HomePayment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('status, amount, due_date')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error fetching payment status:', error);
      return null;
    }

    const pendingPayment = data?.[0];

    return {
      pending: !!pendingPayment,
      amount: pendingPayment?.amount,
      dueDate: pendingPayment?.due_date,
    };
  },
};
