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
}

export interface MessageRow {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_anon: boolean;
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
