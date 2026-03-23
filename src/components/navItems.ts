import {
  Activity,
  Folder,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  Bookmark,
} from "lucide-react";

export const navItems = [
  { name: "Dashboard", href: "/", icon: Activity },
  { name: "Study Vault", href: "/vault", icon: Folder },
  { name: "Exam Archive", href: "/archive", icon: FileText },
  { name: "Schedule Manager", href: "/schedule", icon: Calendar },
  { name: "Network Hub", href: "/hub", icon: MessageSquare },
  { name: "Synergy Groups", href: "/groups", icon: Users },
  { name: "Task Terminal", href: "/tasks", icon: Bookmark },
];
