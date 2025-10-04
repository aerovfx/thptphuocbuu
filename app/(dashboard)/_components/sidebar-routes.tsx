"use client";

import { BarChart, Compass, Layout, List, Trophy, BookOpen, FileEdit, FileText, GraduationCap, StickyNote, Kanban, BookOpenCheck, Zap, Award, MessageSquare, Palette, Map } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { SidebarItem } from "./sidebar-item";

const guestRoutes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/",
  },
  {
    icon: Compass,
    label: "Browse",
    href: "/search",
  },
];

const studentRoutes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    icon: Trophy,
    label: "Bảng điều khiển",
    href: "/student-dashboard",
  },
  {
    icon: Map,
    label: "Lộ trình học tập",
    href: "/learning-paths-demo",
  },
  {
    icon: GraduationCap,
    label: "Học tập",
    href: "/dashboard/learning",
  },
  {
    icon: BookOpen,
    label: "My Courses",
    href: "/dashboard/courses",
  },
  {
    icon: FileEdit,
    label: "Assignments",
    href: "/dashboard/assignments",
  },
  {
    icon: FileText,
    label: "Quizzes",
    href: "/dashboard/quizzes",
  },
  {
    icon: Award,
    label: "Cuộc thi",
    href: "/dashboard/competition",
  },
  // {
  //   icon: MessageSquare,
  //   label: "Live Chat",
  //   href: "/dashboard/chat",
  // },
  {
    icon: Zap,
    label: "STEM Projects",
    href: "/dashboard/stem",
  },
  {
    icon: StickyNote,
    label: "Ghi chú",
    href: "/dashboard/notes",
  },
  {
    icon: Kanban,
    label: "Scrum Board",
    href: "/dashboard/scrumboard",
  },
  {
    icon: BookOpenCheck,
    label: "Danh bạ",
    href: "/dashboard/contacts",
  },
  {
    icon: Palette,
    label: "Theme Demo",
    href: "/dashboard/theme",
  },
  {
    icon: Compass,
    label: "Browse",
    href: "/search",
  },
];

const teacherRoutes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/teacher/dashboard",
  },
  {
    icon: List,
    label: "Courses",
    href: "/teacher/courses",
  },
  {
    icon: FileEdit,
    label: "Assignments",
    href: "/teacher/assignments",
  },
  {
    icon: BarChart,
    label: "Analytics",
    href: "/teacher/analytics",
  },
  // {
  //   icon: MessageSquare,
  //   label: "Live Chat",
  //   href: "/dashboard/chat",
  // },
  {
    icon: Zap,
    label: "STEM Projects",
    href: "/teacher/stem",
  },
  {
    icon: StickyNote,
    label: "Ghi chú",
    href: "/dashboard/notes",
  },
  {
    icon: Kanban,
    label: "Scrum Board",
    href: "/dashboard/scrumboard",
  },
  {
    icon: BookOpenCheck,
    label: "Danh bạ",
    href: "/dashboard/contacts",
  },
  {
    icon: Palette,
    label: "Theme Demo",
    href: "/dashboard/theme",
  },
]

export const SidebarRoutes = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isTeacherPage = pathname?.includes("/teacher");
  const isStudent = session?.user?.role === "STUDENT";

  let routes;
  if (isTeacherPage) {
    routes = teacherRoutes;
  } else if (isStudent) {
    routes = studentRoutes;
  } else {
    routes = guestRoutes;
  }

  return (
    <div className="flex flex-col w-full">
      {routes.map((route) => (
        <SidebarItem
          key={route.href}
          icon={route.icon}
          label={route.label}
          href={route.href}
        />
      ))}
    </div>
  )
}