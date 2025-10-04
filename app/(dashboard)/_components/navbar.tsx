import { NavbarRoutes } from "@/components/navbar-routes"
import { MobileSidebar } from "./mobile-sidebar"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { ThemeCustomizer } from "@/components/theme/theme-customizer"

export const Navbar = () => {
  return (
    <div className="p-4 border-b h-full flex items-center justify-between bg-white shadow-sm">
      <div className="flex items-center">
        <MobileSidebar />
        <NavbarRoutes />
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <ThemeCustomizer />
      </div>
    </div>
  )
}