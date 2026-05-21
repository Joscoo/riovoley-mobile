export interface ScheduleItem {
  id: string;
  day_of_week: string;
  category: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  description?: string | null;
}

export interface ScheduleMutationInput {
  day_of_week: string;
  category: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
}

export interface ScheduleFormState {
  day_of_week: string;
  category: string;
  start_time: string;
  end_time: string;
  description: string;
}
