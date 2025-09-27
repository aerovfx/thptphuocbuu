"use client";

import { BarChart, Compass, Layout, List, Trophy, BookOpen, FileEdit, FileText } from "lucide-react";
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
    icon: Trophy,
    label: "Achievements",
    href: "/dashboard/achievements",
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