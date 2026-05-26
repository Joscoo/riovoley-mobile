import { supabase } from '@/lib/supabase';
import type {
  AthleteOption,
  MembershipType,
  PaymentActionResult,
  PaymentFilters,
  PaymentFormInput,
  PaymentItem,
  PaymentStatus,
} from '../types/payment.types';

type OwnerMode = 'user' | 'student';

let ownerModeCache: OwnerMode | null = null;
const columnCache = new Map<string, string | null>();
let membershipTypeIdCache: { normal?: number; group?: number } | null = null;

const getDaysRemaining = (dueDate: string | null): number => {
  if (!dueDate) return 0;
  const end = new Date(`${String(dueDate).slice(0, 10)}T23:59:59`);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const STATUS_BY_DUE_DATE = (dueDate: string | null): PaymentStatus => {
  const daysRemaining = getDaysRemaining(dueDate);
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 5) return 'expiring';
  return 'active';
};

const mapMembershipType = (value: string | null | undefined): MembershipType => {
  const normalized = (value || '').toLowerCase();
  return normalized.includes('group') || normalized.includes('grupo') ? 'group' : 'normal';
};

const amountByMembership = (type: MembershipType) => (type === 'group' ? 32.5 : 35);

const normalize = (value: string | null | undefined) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const addDays = (dateIso: string, days: number) => {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const isMissingColumnError = (error: any) => String(error?.message || '').toLowerCase().includes('does not exist');

const resolveColumn = async (candidates: string[]): Promise<string | null> => {
  const cacheKey = candidates.join('|');
  if (columnCache.has(cacheKey)) return columnCache.get(cacheKey) || null;

  for (const candidate of candidates) {
    const probe = await supabase.from('payments').select(`id,${candidate}`).limit(1);
    if (!probe.error) {
      columnCache.set(cacheKey, candidate);
      return candidate;
    }
    if (!isMissingColumnError(probe.error)) {
      break;
    }
  }

  columnCache.set(cacheKey, null);
  return null;
};

const resolveMembershipTypeId = async (type: MembershipType): Promise<number | null> => {
  if (membershipTypeIdCache?.[type]) return membershipTypeIdCache[type] || null;

  const { data, error } = await supabase.from('membership_types').select('*').limit(50);
  if (error || !data || data.length === 0) return null;

  const asRows = data as any[];
  const pick = (keywords: string[]) =>
    asRows.find((row) => {
      const text = Object.values(row)
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ');
      return keywords.some((k) => text.includes(k));
    });

  const normalRow = pick(['normal', 'mensualidad normal', 'individual']);
  const groupRow = pick(['group', 'grupo', 'grupal']);

  membershipTypeIdCache = {
    normal: Number(normalRow?.id || normalRow?.membership_type_id || 0) || undefined,
    group: Number(groupRow?.id || groupRow?.membership_type_id || 0) || undefined,
  };

  return membershipTypeIdCache[type] || null;
};

const toItem = (
  row: any,
  user: any,
  category: string | null,
  resolvedUserId: string,
  columns: {
    amount: string | null;
    status: string | null;
    paymentDate: string | null;
    dueDate: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    membershipType: string | null;
    notes: string | null;
    createdAt: string | null;
  },
): PaymentItem => {
  const athleteName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Atleta';
  const paymentDate = (columns.paymentDate ? row[columns.paymentDate] : null) || row.created_at || new Date().toISOString().slice(0, 10);
  const dueDate = columns.dueDate ? row[columns.dueDate] || null : null;
  const membershipType = mapMembershipType(columns.membershipType ? row[columns.membershipType] : 'normal');
  const periodStartRaw = columns.periodStart ? row[columns.periodStart] : null;
  const periodEndRaw = columns.periodEnd ? row[columns.periodEnd] : null;
  const periodStartResolved = periodStartRaw || paymentDate;
  const periodEndResolved = periodEndRaw || dueDate || addDays(String(paymentDate).slice(0, 10), 30);
  const daysRemaining = getDaysRemaining(periodEndResolved ? String(periodEndResolved).slice(0, 10) : null);
  const status = STATUS_BY_DUE_DATE(periodEndResolved ? String(periodEndResolved).slice(0, 10) : null);

  return {
    id: String(row.id),
    userId: resolvedUserId,
    athleteName,
    athleteEmail: user?.email || 'Sin correo',
    category,
    membershipType,
    amount: Number((columns.amount ? row[columns.amount] : null) || amountByMembership(membershipType)),
    status,
    daysRemaining,
    paymentDate: String(paymentDate).slice(0, 10),
    dueDate: dueDate ? String(dueDate).slice(0, 10) : null,
    periodStart: periodStartResolved ? String(periodStartResolved).slice(0, 10) : null,
    periodEnd: periodEndResolved ? String(periodEndResolved).slice(0, 10) : null,
    notes: columns.notes ? row[columns.notes] || null : null,
    createdAt: columns.createdAt ? row[columns.createdAt] || null : null,
  };
};

const detectOwnerMode = async (): Promise<OwnerMode> => {
  if (ownerModeCache) return ownerModeCache;

  const userProbe = await supabase.from('payments').select('id,user_id').limit(1);
  if (!userProbe.error) {
    ownerModeCache = 'user';
    return ownerModeCache;
  }

  const studentProbe = await supabase.from('payments').select('id,student_id').limit(1);
  if (!studentProbe.error) {
    ownerModeCache = 'student';
    return ownerModeCache;
  }

  throw new Error(studentProbe.error?.message || userProbe.error?.message || 'No se pudo detectar el esquema de pagos.');
};

export const paymentsService = {
  validateForm(input: PaymentFormInput): PaymentActionResult {
    if (!input.userId) return { ok: false, message: 'Debes seleccionar un atleta.' };
    if (!input.paymentDate) return { ok: false, message: 'Debes seleccionar la fecha de pago.' };
    const selected = new Date(input.paymentDate);
    if (Number.isNaN(selected.getTime())) return { ok: false, message: 'La fecha de pago es invalida.' };
    const today = new Date();
    if (selected.getTime() > today.getTime()) {
      return { ok: false, message: 'La fecha de pago no puede ser futura.' };
    }
    return { ok: true, message: '' };
  },

  async fetchAthleteOptions(): Promise<AthleteOption[]> {
    const { data, error } = await supabase
      .from('students')
      .select('id,user_id,categoria,users!user_id(nombre,apellido,email,suspended)')
      .order('id', { ascending: false });

    if (error) throw new Error(error.message || 'No se pudieron cargar atletas.');

    return (data || [])
      .filter((row: any) => !row.users?.suspended)
      .map((row: any) => {
        const label = `${row.users?.nombre || ''} ${row.users?.apellido || ''}`.trim() || row.users?.email || 'Atleta';
        return {
          studentId: String(row.id),
          userId: String(row.user_id),
          label,
          category: row.categoria || null,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
  },

  async fetchPayments(filters?: PaymentFilters): Promise<PaymentItem[]> {
    const ownerMode = await detectOwnerMode();
    const ownerColumn = ownerMode === 'user' ? 'user_id' : 'student_id';
    const amountColumn = await resolveColumn(['amount', 'monto']);
    const statusColumn = await resolveColumn(['status', 'estado']);
    const paymentDateColumn = await resolveColumn(['payment_date', 'fecha_pago', 'date']);
    const dueDateColumn = await resolveColumn(['due_date', 'fecha_vencimiento']);
    const periodStartColumn = await resolveColumn(['period_start', 'periodo_inicio']);
    const periodEndColumn = await resolveColumn(['period_end', 'periodo_fin']);
    const membershipTypeColumn = await resolveColumn(['membership_type', 'monthly_type', 'plan_type', 'tipo_mensualidad']);
    const notesColumn = await resolveColumn(['notes', 'observations', 'observaciones']);
    const createdAtColumn = await resolveColumn(['created_at', 'fecha_creacion']);

    const projectionColumns = [
      ownerColumn,
      amountColumn,
      statusColumn,
      paymentDateColumn,
      dueDateColumn,
      periodStartColumn,
      periodEndColumn,
      membershipTypeColumn,
      notesColumn,
      createdAtColumn,
    ].filter(Boolean) as string[];

    const { data, error } = await supabase
      .from('payments')
      .select(`id,${projectionColumns.join(',')}`)
      .order(paymentDateColumn || createdAtColumn || 'id', { ascending: false });

    if (error) throw new Error(error.message || 'No se pudieron cargar pagos.');

    const rows = data || [];

    let userById = new Map<string, any>();
    let categoryByUserId = new Map<string, string | null>();
    let userIdByStudentId = new Map<string, string>();

    if (ownerMode === 'user') {
      const userIds = [...new Set(rows.map((r: any) => String(r.user_id)).filter(Boolean))];
      if (userIds.length > 0) {
        const [{ data: usersData }, { data: studentsData }] = await Promise.all([
          supabase.from('users').select('id,nombre,apellido,email').in('id', userIds),
          supabase.from('students').select('user_id,categoria').in('user_id', userIds),
        ]);

        userById = new Map((usersData || []).map((u: any) => [String(u.id), u]));
        categoryByUserId = new Map((studentsData || []).map((s: any) => [String(s.user_id), s.categoria || null]));
      }
    } else {
      const studentIds = [...new Set(rows.map((r: any) => String(r.student_id)).filter(Boolean))];
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('id,user_id,categoria')
          .in('id', studentIds);

        const userIds = [...new Set((studentsData || []).map((s: any) => String(s.user_id)).filter(Boolean))];
        const { data: usersData } = await supabase
          .from('users')
          .select('id,nombre,apellido,email')
          .in('id', userIds);

        userById = new Map((usersData || []).map((u: any) => [String(u.id), u]));

        (studentsData || []).forEach((s: any) => {
          const sid = String(s.id);
          const uid = String(s.user_id);
          if (sid && uid) {
            userIdByStudentId.set(sid, uid);
            categoryByUserId.set(uid, s.categoria || null);
          }
        });
      }
    }

    let items = rows.map((row: any) => {
      const resolvedUserId = ownerMode === 'user' ? String(row.user_id || '') : userIdByStudentId.get(String(row.student_id)) || '';
      const user = userById.get(resolvedUserId) || {};
      const category = categoryByUserId.get(resolvedUserId) || null;
      return toItem(
        row,
        user,
        category,
        resolvedUserId,
        {
          amount: amountColumn,
          status: statusColumn,
          paymentDate: paymentDateColumn,
          dueDate: dueDateColumn,
          periodStart: periodStartColumn,
          periodEnd: periodEndColumn,
          membershipType: membershipTypeColumn,
          notes: notesColumn,
          createdAt: createdAtColumn,
        },
      );
    });

    if (filters) {
      if (filters.status !== 'all') items = items.filter((item) => item.status === filters.status);
      if (filters.membershipType !== 'all') items = items.filter((item) => item.membershipType === filters.membershipType);
      if (filters.search.trim()) {
        const q = normalize(filters.search.trim());
        items = items.filter((item) => normalize(item.athleteName).includes(q) || normalize(item.athleteEmail).includes(q));
      }
    }

    return items;
  },

  async createPayment(input: PaymentFormInput): Promise<PaymentActionResult> {
    const validation = this.validateForm(input);
    if (!validation.ok) return validation;

    const ownerMode = await detectOwnerMode();
    if (ownerMode === 'student' && !input.studentId) {
      return { ok: false, message: 'No se pudo resolver el atleta para registrar el pago.' };
    }

    const membershipType = input.membershipType;
    const amount = amountByMembership(membershipType);
    const periodStart = input.paymentDate;
    const periodEnd = addDays(input.paymentDate, 30);

    const payload: any = {};
    const amountColumn = await resolveColumn(['amount', 'monto']);
    const statusColumn = await resolveColumn(['status', 'estado']);
    const paymentDateColumn = await resolveColumn(['payment_date', 'fecha_pago', 'date']);
    const dueDateColumn = await resolveColumn(['due_date', 'fecha_vencimiento']);
    const periodStartColumn = await resolveColumn(['period_start', 'periodo_inicio']);
    const periodEndColumn = await resolveColumn(['period_end', 'periodo_fin']);
    const membershipTypeColumn = await resolveColumn(['membership_type', 'monthly_type', 'plan_type', 'tipo_mensualidad']);
    const membershipTypeIdColumn = await resolveColumn(['membership_type_id', 'tipo_mensualidad_id']);
    const notesColumn = await resolveColumn(['notes', 'observations', 'observaciones']);

    if (amountColumn) payload[amountColumn] = amount;
    if (statusColumn) payload[statusColumn] = 'pending';
    if (paymentDateColumn) payload[paymentDateColumn] = input.paymentDate;
    if (dueDateColumn) payload[dueDateColumn] = periodEnd;
    if (periodStartColumn) payload[periodStartColumn] = periodStart;
    if (periodEndColumn) payload[periodEndColumn] = periodEnd;
    if (membershipTypeColumn) payload[membershipTypeColumn] = membershipType;
    if (membershipTypeIdColumn) {
      const membershipTypeId = await resolveMembershipTypeId(membershipType);
      if (membershipTypeId != null) {
        payload[membershipTypeIdColumn] = membershipTypeId;
      }
    }
    if (notesColumn) payload[notesColumn] = input.notes.trim() || null;

    if (ownerMode === 'user') payload.user_id = input.userId;
    if (ownerMode === 'student') payload.student_id = input.studentId;

    const { error } = await supabase.from('payments').insert(payload);

    if (error && String(error.message || '').toLowerCase().includes('membership_type_id')) {
      const membershipTypeId = await resolveMembershipTypeId(membershipType);
      if (membershipTypeId != null) {
        const retryPayload = { ...payload, membership_type_id: membershipTypeId };
        const retry = await supabase.from('payments').insert(retryPayload);
        if (!retry.error) return { ok: true, message: 'Pago registrado correctamente.' };
        return { ok: false, message: retry.error.message || 'No se pudo registrar el pago.' };
      }
    }
    if (error) return { ok: false, message: error.message || 'No se pudo registrar el pago.' };
    return { ok: true, message: 'Pago registrado correctamente.' };
  },

  async updatePayment(id: string, input: PaymentFormInput): Promise<PaymentActionResult> {
    const validation = this.validateForm(input);
    if (!validation.ok) return validation;

    const ownerMode = await detectOwnerMode();
    if (ownerMode === 'student' && !input.studentId) {
      return { ok: false, message: 'No se pudo resolver el atleta para actualizar el pago.' };
    }

    const membershipType = input.membershipType;
    const amount = amountByMembership(membershipType);

    const payload: any = {};
    const amountColumn = await resolveColumn(['amount', 'monto']);
    const paymentDateColumn = await resolveColumn(['payment_date', 'fecha_pago', 'date']);
    const dueDateColumn = await resolveColumn(['due_date', 'fecha_vencimiento']);
    const periodStartColumn = await resolveColumn(['period_start', 'periodo_inicio']);
    const periodEndColumn = await resolveColumn(['period_end', 'periodo_fin']);
    const membershipTypeColumn = await resolveColumn(['membership_type', 'monthly_type', 'plan_type', 'tipo_mensualidad']);
    const membershipTypeIdColumn = await resolveColumn(['membership_type_id', 'tipo_mensualidad_id']);
    const notesColumn = await resolveColumn(['notes', 'observations', 'observaciones']);

    if (amountColumn) payload[amountColumn] = amount;
    if (paymentDateColumn) payload[paymentDateColumn] = input.paymentDate;
    if (periodStartColumn) payload[periodStartColumn] = input.paymentDate;
    if (periodEndColumn) payload[periodEndColumn] = addDays(input.paymentDate, 30);
    if (dueDateColumn) payload[dueDateColumn] = addDays(input.paymentDate, 30);
    if (membershipTypeColumn) payload[membershipTypeColumn] = membershipType;
    if (membershipTypeIdColumn) {
      const membershipTypeId = await resolveMembershipTypeId(membershipType);
      if (membershipTypeId != null) {
        payload[membershipTypeIdColumn] = membershipTypeId;
      }
    }
    if (notesColumn) payload[notesColumn] = input.notes.trim() || null;

    if (ownerMode === 'user') payload.user_id = input.userId;
    if (ownerMode === 'student') payload.student_id = input.studentId;

    const { error } = await supabase
      .from('payments')
      .update(payload)
      .eq('id', id);

    if (error) return { ok: false, message: error.message || 'No se pudo actualizar el pago.' };
    return { ok: true, message: 'Pago actualizado correctamente.' };
  },

  async deletePayment(id: string): Promise<PaymentActionResult> {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) return { ok: false, message: error.message || 'No se pudo eliminar el pago.' };
    return { ok: true, message: 'Pago eliminado correctamente.' };
  },
};
