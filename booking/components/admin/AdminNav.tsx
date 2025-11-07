"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  BarChart3,
  PackageOpen,
  Clock,
  LogOut
} from "lucide-react";

export default function AdminNav({ session }: { session: any }) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Bookings", path: "/admin/bookings", icon: Calendar },
    { name: "Customers", path: "/admin/customers", icon: Users },
    { name: "Services", path: "/admin/services", icon: PackageOpen },
    { name: "Availability", path: "/admin/availability", icon: Clock },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#0b3d2e] dark:bg-[#0b3d2e] border-b border-[#0a3426] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
  <div className="flex items-center justify-between h-14 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <div 
              className="w-7 h-7 rounded-full bg-white flex items-center justify-center cursor-pointer"
              onClick={() => router.push("/admin/dashboard")}
            >
              <span className="text-[#0b3d2e] font-bold text-sm">M</span>
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-white hidden md:block text-sm truncate max-w-[12rem]">
                Admin Dashboard
              </span>
            </div>
          </div>

          {/* Nav Items - Desktop */}
          <div className="hidden lg:flex items-center gap-1 min-w-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive(item.path)
                      ? "bg-white text-[#0b3d2e]"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Mobile Nav (moved inline) */}
          <div className="lg:hidden flex gap-0.5 overflow-x-auto pb-2 -mx-1 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition whitespace-nowrap flex-shrink-0 ${
                    isActive(item.path)
                      ? "bg-white text-[#0b3d2e]"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block min-w-0">
              <p className="text-xs font-medium text-white">
                {session?.user?.name}
              </p>
              <p className="text-[10px] text-white/70">
                {session?.user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-white hover:bg-white/10 h-8 flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="ml-1.5 hidden md:inline text-xs">Sign Out</span>
            </Button>
          </div>
        </div>

        
      </div>
    </nav>
  );
}