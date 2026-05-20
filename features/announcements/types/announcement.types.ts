export interface AnnouncementItem {
  id: string;
  title: string;
  content: string | null;
  createdAt: string | null;
  isActive: boolean;
  targetAudience: string[];
  priority?: string | null;
  expiresAt?: string | null;
}
