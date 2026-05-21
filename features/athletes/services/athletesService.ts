import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type {
  AthleteActionResult,
  AthleteFormInput,
  AthleteItem,
  AthleteQuery,
  ResendCredentialsInput,
  SuspendPayload,
} from '../types/athletes.types';

const FALLBACK_CATEGORIES = [
  'iniciacion_hombres',
  'iniciacion_mujeres',
  'perfeccionamiento_hombres',
  'perfeccionamiento_mujeres',
  'open_gym',
  'master_mujeres',
] as const;

const MIN_ATHLETE_AGE = 5;

const normalizeText = (value: string | null | undefined) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const calculateAge = (birthDateString: string) => {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
};

const validateBirthDate = (birthDate: string) => {
  if (!birthDate) return { isValid: false, error: 'La fecha de nacimiento es requerida.' };
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return { isValid: false, error: 'Fecha de nacimiento invalida.' };
  const age = calculateAge(birthDate);
  if (age < MIN_ATHLETE_AGE) {
    return { isValid: false, error: `El atleta debe tener al menos ${MIN_ATHLETE_AGE} años.` };
  }
  return { isValid: true, error: null };
};

const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%'[Math.floor(Math.random() * 5)];
  for (let i = 4; i < 12; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const createIsolatedAuthClient = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const noopStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: noopStorage,
      storageKey: 'sb-isolated-auth-token-mobile',
    },
  });
};

const toViewModel = (row: any): AthleteItem => {
  const users = row.users || row.user || {};
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    categoria: row.categoria ?? null,
    fecha_nacimiento: row.fecha_nacimiento ?? null,
    users: {
      id: String(users.id || row.user_id),
      email: users.email ?? null,
      nombre: users.nombre ?? null,
      apellido: users.apellido ?? null,
      telefono: users.telefono ?? null,
      role: users.role ?? null,
      created_at: users.created_at ?? null,
      suspended: users.suspended ?? false,
      suspension_reason: users.suspension_reason ?? null,
      suspension_until: users.suspension_until ?? null,
      suspended_at: users.suspended_at ?? null,
    },
    full_name: `${users.nombre || ''} ${users.apellido || ''}`.trim() || `Atleta ${row.id}`,
    email: users.email || 'No disponible',
    telefono: users.telefono || 'No disponible',
    suspended: Boolean(users.suspended),
  };
};

const sortAthletes = (items: AthleteItem[], sortBy: string, sortOrder: 'asc' | 'desc') => {
  const result = [...items];
  result.sort((a, b) => {
    let valueA: number | string = '';
    let valueB: number | string = '';

    switch (sortBy) {
      case 'nombre':
        valueA = normalizeText(a.users.nombre);
        valueB = normalizeText(b.users.nombre);
        break;
      case 'categoria':
        valueA = normalizeText(a.categoria);
        valueB = normalizeText(b.categoria);
        break;
      case 'edad':
        valueA = a.fecha_nacimiento ? calculateAge(a.fecha_nacimiento) : Number.MAX_SAFE_INTEGER;
        valueB = b.fecha_nacimiento ? calculateAge(b.fecha_nacimiento) : Number.MAX_SAFE_INTEGER;
        break;
      case 'ingreso':
        valueA = a.users.created_at ? new Date(a.users.created_at).getTime() : Number.MAX_SAFE_INTEGER;
        valueB = b.users.created_at ? new Date(b.users.created_at).getTime() : Number.MAX_SAFE_INTEGER;
        break;
      case 'apellido':
      default:
        valueA = normalizeText(a.users.apellido);
        valueB = normalizeText(b.users.apellido);
        break;
    }

    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  return result;
};

export const athletesService = {
  async fetchAthletes(query?: AthleteQuery): Promise<AthleteItem[]> {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        user_id,
        categoria,
        fecha_nacimiento,
        users!user_id (
          id,
          email,
          nombre,
          apellido,
          telefono,
          role,
          created_at,
          suspended,
          suspension_reason,
          suspension_until,
          suspended_at
        )
      `);

    if (error) {
      throw new Error(error.message || 'No se pudieron cargar los atletas.');
    }

    const filters = query?.filters || {};

    let rows = (data || []).map(toViewModel);

    if (filters.status === 'active') rows = rows.filter((item) => !item.suspended);
    if (filters.status === 'suspended') rows = rows.filter((item) => item.suspended);
    if (filters.categoria) rows = rows.filter((item) => item.categoria === filters.categoria);

    if (filters.search) {
      const q = normalizeText(filters.search);
      rows = rows.filter((item) => (
        normalizeText(item.full_name).includes(q)
        || normalizeText(item.email).includes(q)
        || normalizeText(item.categoria).includes(q)
      ));
    }

    return sortAthletes(rows, filters.sortBy || 'apellido', filters.sortOrder || 'asc');
  },

  async fetchCategories(): Promise<string[]> {
    const set = new Set<string>();

    const [schedules, students] = await Promise.all([
      supabase.from('schedules').select('categoria, category'),
      supabase.from('students').select('categoria').limit(300),
    ]);

    if (schedules.data) {
      schedules.data.forEach((row: any) => {
        const value = (row.categoria || row.category || '').trim();
        if (value) set.add(value);
      });
    }

    if (students.data) {
      students.data.forEach((row: any) => {
        const value = (row.categoria || '').trim();
        if (value) set.add(value);
      });
    }

    const ordered = FALLBACK_CATEGORIES.filter((c) => set.has(c));
    const extras = [...set].filter((c) => !FALLBACK_CATEGORIES.includes(c as any)).sort();
    const merged = [...ordered, ...extras];
    return merged.length ? merged : [...FALLBACK_CATEGORIES];
  },

  validateAthleteForm(input: AthleteFormInput): AthleteActionResult {
    if (!input.nombre.trim()) return { ok: false, message: 'El nombre es obligatorio.' };
    if (!input.apellido.trim()) return { ok: false, message: 'El apellido es obligatorio.' };
    if (!input.email.trim()) return { ok: false, message: 'El email es obligatorio.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      return { ok: false, message: 'El email no es valido.' };
    }

    const birthDateValidation = validateBirthDate(input.fecha_nacimiento);
    if (!birthDateValidation.isValid) {
      return { ok: false, message: birthDateValidation.error || 'Fecha de nacimiento invalida.' };
    }

    if (!input.categoria.trim()) {
      return { ok: false, message: 'La categoria es obligatoria.' };
    }

    return { ok: true, message: '' };
  },

  async createAthlete(input: AthleteFormInput, opts: { sendCredentials: boolean }): Promise<AthleteActionResult> {
    const validation = this.validateAthleteForm(input);
    if (!validation.ok) return validation;

    const isolatedAuth = createIsolatedAuthClient();
    const authClient = isolatedAuth || supabase;

    const email = input.email.trim().toLowerCase();

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser?.id) {
      return { ok: false, message: 'El email ya esta registrado.' };
    }

    const temporaryPassword = generateTemporaryPassword();

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email,
      password: temporaryPassword,
      options: {
        data: {
          full_name: `${input.nombre.trim()} ${input.apellido.trim()}`,
          role: 'estudiante',
        },
      },
    });

    if (authError || !authData.user) {
      return { ok: false, message: authError?.message || 'No se pudo crear el usuario en Auth.' };
    }

    const userId = authData.user.id;

    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email,
      role: 'estudiante',
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      telefono: input.telefono.trim() || null,
      fecha_nacimiento: input.fecha_nacimiento,
      first_login: true,
    });

    if (userError) {
      return { ok: false, message: userError.message || 'No se pudo crear el usuario de atleta.' };
    }

    await supabase.from('user_profiles').upsert(
      {
        id: userId,
        full_name: `${input.nombre.trim()} ${input.apellido.trim()}`,
        role: 'estudiante',
      },
      { onConflict: 'id' }
    );

    const { error: studentError } = await supabase.from('students').insert({
      user_id: userId,
      categoria: input.categoria,
      fecha_nacimiento: input.fecha_nacimiento,
    });

    if (studentError) {
      await supabase.from('users').delete().eq('id', userId);
      return { ok: false, message: studentError.message || 'No se pudo crear el registro de atleta.' };
    }

    if (opts.sendCredentials) {
      const resend = await this.resendAthleteCredentials({
        userId,
        email,
        nombre: input.nombre.trim(),
        apellido: input.apellido.trim(),
      });
      if (!resend.ok) {
        return { ok: true, message: `Atleta creado, pero fallo envio de credenciales: ${resend.message}` };
      }
    }

    return { ok: true, message: 'Atleta creado correctamente.' };
  },

  async updateAthlete(athleteId: string, input: AthleteFormInput): Promise<AthleteActionResult> {
    const validation = this.validateAthleteForm(input);
    if (!validation.ok) return validation;

    const { data: student, error: studentFindError } = await supabase
      .from('students')
      .select('id,user_id')
      .eq('id', athleteId)
      .single();

    if (studentFindError || !student) {
      return { ok: false, message: 'No se encontro el atleta a editar.' };
    }

    const { error: userError } = await supabase
      .from('users')
      .update({
        nombre: input.nombre.trim(),
        apellido: input.apellido.trim(),
        email: input.email.trim().toLowerCase(),
        telefono: input.telefono.trim() || null,
        fecha_nacimiento: input.fecha_nacimiento,
      })
      .eq('id', student.user_id);

    if (userError) return { ok: false, message: userError.message || 'No se pudo actualizar usuario.' };

    const { error: athleteError } = await supabase
      .from('students')
      .update({
        categoria: input.categoria,
        fecha_nacimiento: input.fecha_nacimiento,
      })
      .eq('id', athleteId);

    if (athleteError) return { ok: false, message: athleteError.message || 'No se pudo actualizar atleta.' };

    return { ok: true, message: 'Atleta actualizado correctamente.' };
  },

  async suspendAthlete(userId: string, payload: SuspendPayload): Promise<AthleteActionResult> {
    const { error } = await supabase
      .from('users')
      .update({
        suspended: true,
        suspension_reason: payload.reason || 'Suspendido por administracion',
        suspension_until: payload.until || null,
        suspended_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) return { ok: false, message: error.message || 'No se pudo suspender el atleta.' };
    return { ok: true, message: 'Atleta suspendido correctamente.' };
  },

  async reactivateAthlete(userId: string): Promise<AthleteActionResult> {
    const { error } = await supabase
      .from('users')
      .update({
        suspended: false,
        suspension_reason: null,
        suspension_until: null,
        suspended_at: null,
      })
      .eq('id', userId);

    if (error) return { ok: false, message: error.message || 'No se pudo reactivar el atleta.' };
    return { ok: true, message: 'Atleta reactivado correctamente.' };
  },

  async resendAthleteCredentials(userData: ResendCredentialsInput): Promise<AthleteActionResult> {
    const newPassword = generateTemporaryPassword();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      return { ok: false, message: 'Sesion no valida para reenviar credenciales.' };
    }

    const { data: updateData, error: updateError } = await supabase.functions.invoke('update-user-password', {
      body: { userId: userData.userId, newPassword },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (updateError || !updateData?.success) {
      return { ok: false, message: updateError?.message || updateData?.message || 'No se pudo actualizar la contraseña temporal.' };
    }

    await supabase.from('users').update({ first_login: true }).eq('id', userData.userId);

    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: userData.email,
        subject: 'Credenciales RioVoley',
        html: `<p>Hola ${userData.nombre} ${userData.apellido},</p>
               <p>Tu nueva contraseña temporal es: <b>${newPassword}</b></p>
               <p>Inicia sesión y cámbiala al ingresar.</p>`,
      },
    });

    if (emailError) {
      return { ok: true, message: 'Contraseña temporal actualizada. No se pudo enviar el correo.' };
    }

    return { ok: true, message: 'Credenciales reenviadas correctamente.' };
  },

  async deleteAthleteCompletely(athlete: AthleteItem): Promise<AthleteActionResult> {
    // Clean dependent rows first to avoid FK violations on students.id
    await supabase.from('attendances').delete().eq('student_id', athlete.id);
    await supabase.from('payments').delete().eq('student_id', athlete.id);
    await supabase.from('physical_tests').delete().eq('student_id', athlete.id);

    const { error: studentError } = await supabase.from('students').delete().eq('id', athlete.id);
    if (studentError) {
      return { ok: false, message: studentError.message || 'No se pudo eliminar el registro de atleta.' };
    }

    const { error: userError } = await supabase.from('users').delete().eq('id', athlete.user_id);
    if (userError) {
      return { ok: false, message: `Atleta eliminado de students, pero no de users: ${userError.message}` };
    }

    // Best effort: puede no existir esta edge function en todos los entornos.
    await supabase.functions.invoke('delete-auth-user', {
      body: { userId: athlete.user_id },
    }).catch(() => null);

    return { ok: true, message: 'Atleta eliminado completamente.' };
  },
};
