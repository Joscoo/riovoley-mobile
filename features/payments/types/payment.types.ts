export type PaymentStatus = 'active' | 'expiring' | 'overdue';
export type MembershipType = 'normal' | 'group';

export interface AthleteOption {
  studentId: string;
  userId: string;
  label: string;
  category: string | null;
}

export interface PaymentItem {
  id: string;
  userId: string;
  athleteName: string;
  athleteEmail: string;
  category: string | null;
  membershipType: MembershipType;
  amount: number;
  status: PaymentStatus;
  daysRemaining: number;
  paymentDate: string;
  dueDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  notes: string | null;
  createdAt: string | null;
}

export interface PaymentFormInput {
  userId: string;
  studentId?: string;
  paymentDate: string;
  membershipType: MembershipType;
  notes: string;
}

export interface PaymentFilters {
  search: string;
  status: 'all' | PaymentStatus;
  membershipType: 'all' | MembershipType;
}

export interface PaymentActionResult {
  ok: boolean;
  message: string;
}
