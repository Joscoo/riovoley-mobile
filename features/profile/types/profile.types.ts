export interface ProfileData {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
  phone?: string | null;
  createdAt?: string | null;
}
