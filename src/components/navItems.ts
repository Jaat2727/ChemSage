import {
  LayoutDashboard,
  Folder,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  Bookmark,
} from "lucide-react";

export const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Resource Vault", href: "/vault", icon: Folder },
  { name: "Past Papers", href: "/archive", icon: FileText },
  { name: "Class Planner", href: "/schedule", icon: Calendar },
  { name: "Direct Chats", href: "/hub", icon: MessageSquare },
  { name: "Study Circles", href: "/groups", icon: Users },
  { name: "Task Board", href: "/tasks", icon: Bookmark },
];
