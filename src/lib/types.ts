export type Programme = "BS" | "MSc" | "PhD";
export type ProfileStatus = "pending" | "active" | "banned";
export type ProfileRole = "student" | "admin";

export interface SessionUser {
  id: string;
  email?: string;
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  user: SessionUser;
}

export interface RegisteredRollNo {
  roll_no: string;
  name: string;
  programme: Programme;
  batch_year: number;
  imported_at?: string;
}

export interface Profile {
  id: string;
  roll_no: string;
  name: string;
  programme: Programme;
  batch_year: number;
  status: ProfileStatus;
  role: ProfileRole;
  created_at?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  academic_interests?: string[];
  preferred_subjects?: string[];
  last_active?: string;
  reputation_score?: number;
}

export interface MessageRow {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_anon: boolean;
  is_pinned?: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  location?: string | null;
  contact_info?: string | null;
  invited_people?: string | null;
  created_by: string;
  is_public: boolean;
  created_at?: string;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  joined_at?: string;
  last_read_at?: string;
  is_favorite?: boolean;
}

export interface ResourceItem {
  id: string;
  title: string;
  category: "Notes" | "Lab Reports" | "Assignments" | "References";
  file_url: string;
  file_type: string;
  file_size?: number | null;
  uploaded_by: string;
  created_at: string;
  room_id?: string | null;
  tags?: string[];
  download_count?: number;
  updated_at?: string;
  version?: string;
  status?: "active" | "deleted";
  folder_id?: string | null;
  subject?: string;
  semester?: string;
  course_code?: string;
  description?: string;
}

export interface ExamPaper {
  id: string;
  subject: string;
  exam_type: "End Sem" | "Mid Sem" | "Quiz" | "Lab Exam";
  year: number;
  semester: string;
  file_url: string;
  file_size?: number | null;
  uploaded_by: string;
  created_at: string;
  download_count?: number;
  updated_at?: string;
  version?: string;
  status?: "active" | "deleted";
  course_code?: string;
  faculty?: string;
  folder_id?: string | null;
}

export interface ScheduleEntry {
  id: string;
  user_id: string;
  subject: string;
  type: "Lecture" | "Lab" | "Tutorial";
  room_no: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface ChatMessage extends MessageRow {
  sender?: Pick<Profile, "id" | "name" | "roll_no" | "programme" | "batch_year">;
}

// ─── Knowledge Management Types ──────────────────────────────────────────

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: string;
  created_at: string;
  type: "general" | "past_papers";
}

export interface ResourceVersion {
  id: string;
  resource_id?: string;
  paper_id?: string;
  version: string;
  file_url: string;
  file_size?: number;
  changed_by: string;
  change_note?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  resource_id?: string;
  paper_id?: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Pick<Profile, "id" | "name" | "roll_no">;
}

export interface StarRecord {
  id: string;
  user_id: string;
  resource_id?: string;
  paper_id?: string;
  room_id?: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_id?: string;
  target_type: string;
  details?: any;
  created_at: string;
  admin?: Pick<Profile, "id" | "name" | "roll_no">;
}

export type NotificationCategory = "Resources" | "Past Papers" | "Study Circles" | "Tasks" | "Messages" | "Admin" | "System";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationCategory | string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}
