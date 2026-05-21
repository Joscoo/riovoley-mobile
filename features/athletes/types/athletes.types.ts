export type AthleteStatusFilter = 'all' | 'active' | 'suspended';
export type AthleteSortBy = 'apellido' | 'nombre' | 'categoria' | 'edad' | 'ingreso';
export type AthleteSortOrder = 'asc' | 'desc';

export interface AthleteItem {
  id: string;
  user_id: string;
  categoria: string | null;
  fecha_nacimiento: string | null;
  users: {
    id: string;
    email: string | null;
    nombre: string | null;
    apellido: string | null;
    telefono: string | null;
    role: string | null;
    created_at: string | null;
    suspended?: boolean | null;
    suspension_reason?: string | null;
    suspension_until?: string | null;
    suspended_at?: string | null;
  };
  full_name: string;
  email: string;
  telefono: string;
  suspended: boolean;
}

export interface AthleteFormInput {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  categoria: string;
}

export interface AthletesFilters {
  search: string;
  categoria: string;
  status: AthleteStatusFilter;
  sortBy: AthleteSortBy;
  sortOrder: AthleteSortOrder;
}

export interface AthleteActionResult {
  ok: boolean;
  message: string;
}

export interface AthleteQuery {
  filters?: Partial<AthletesFilters>;
}

export interface ResendCredentialsInput {
  userId: string;
  email: string;
  nombre: string;
  apellido: string;
}

export interface SuspendPayload {
  reason?: string;
  until?: string | null;
}
