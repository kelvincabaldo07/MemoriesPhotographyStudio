"use client";
import { Calendar, ShoppingBag, Phone, Globe } from 'lucide-react';

export default function BottomNav({ currentPage }: { currentPage?: string }) {
  const navItems = [
    { name: "Book", path: "/", icon: ShoppingBag },
    { name: "My Bookings", path: "/my-bookings", icon: Calendar },
    { name: "Contact", path: "/contact", icon: Phone },
    { name: "Location", path: "/location", icon: Globe },
    { 
      name: "Website", 
      path: "https://www.memories-studio.com", 
      icon: Globe,
      external: true 
    },
  ];

  const isActive = (path: string) => currentPage === path;

  return (
    <>
      {/* Bottom Tab Bar - Mobile/Tablet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-5 gap-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  if (item.external) {
                    window.open(item.path, '_blank');
                  } else {
                    window.location.href = item.path;
                  }
                }}
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

      {/* Desktop Navigation Bar */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    if (item.external) {
                      window.open(item.path, '_blank');
                    } else {
                      window.location.href = item.path;
                    }
                  }}
                  className={`flex items-center gap-2 text-sm font-medium transition ${
                    active 
                      ? "text-[#0b3d2e] dark:text-white font-semibold" 
                      : "text-gray-700 dark:text-gray-300 hover:text-opacity-80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                  {item.external && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
