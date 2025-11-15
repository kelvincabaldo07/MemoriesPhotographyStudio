"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
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
  
  const getCurrentSection = () => {
    const current = navItems.find(item => isActive(item.path));
    return current?.name || "Admin";
  };

  return (
    <>
      {/* Top Header */}
      <nav className="bg-[#0b3d2e] dark:bg-[#0b3d2e] border-b border-[#0a3426] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14 gap-2">
            {/* Logo & Current Section */}
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center cursor-pointer flex-shrink-0 overflow-hidden"
                onClick={() => router.push("/admin/dashboard")}
              >
                <Image 
                  src="/logo.png" 
                  alt="Memories Studio" 
                  width={32} 
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-white text-base truncate block lg:hidden">
                  {getCurrentSection()}
                </span>
                <span className="font-semibold text-white text-base truncate hidden lg:block">
                  Memories Studio Admin
                </span>
              </div>
            </div>

            {/* Nav Items - Desktop Only */}
            <div className="hidden lg:flex items-center gap-1 min-w-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive(item.path)
                        ? "bg-white text-[#0b3d2e]"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* User Menu - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="text-right min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {session?.user?.name}
                </p>
                <p className="text-[10px] text-white/70 truncate">
                  {session?.user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="text-white hover:bg-white/10 h-9"
              >
                <LogOut className="w-4 h-4" />
                <span className="ml-2 text-sm">Sign Out</span>
              </Button>
            </div>

            {/* Sign Out Button - Mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-white hover:bg-white/10 h-9 lg:hidden"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Bottom Tab Bar - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-6 gap-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center py-2 px-1 transition relative"
              >
                <div className={`flex flex-col items-center justify-center ${
                  active ? "text-white dark:text-white" : "text-gray-500 dark:text-gray-400"
                }`}>
                  <div className={`rounded-lg p-1.5 transition ${
                    active ? "bg-[#0b3d2e] dark:bg-[#0b3d2e]" : ""
                  }`}>
                    <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
                  </div>
                  <span className={`text-[10px] mt-1 ${
                    active ? "font-semibold text-[#0b3d2e] dark:text-white" : "font-medium"
                  }`}>
                    {item.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}