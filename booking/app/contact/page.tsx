"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, ShoppingBag, Globe } from "lucide-react";

const BRAND = {
  charcoal: "#2C2C2C",
  cream: "#FAF3E0",
  white: "#FFFFFF",
  forest: "#0b3d2e",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 pb-24" style={{ backgroundColor: BRAND.cream }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => window.location.href = '/'}>
            ← Back to Home
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            <h1 className="text-h1 font-semibold mb-2" style={{ color: BRAND.forest }}>
              Contact Us
            </h1>
            <p className="text-base-body text-neutral-600 mb-8">
              We&apos;d love to hear from you! Get in touch with us through any of these channels.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Phone */}
              <div className="flex items-start gap-4 p-6 rounded-xl border bg-white shadow-sm">
                <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.forest + '20' }}>
                  <Phone className="w-7 h-7" style={{ color: BRAND.forest }} />
                </div>
                <div>
                  <p className="text-h3 text-neutral-600 font-semibold mb-1">Call or Text</p>
                  <a href="tel:+639064694122" className="text-h2 font-medium hover:underline block" style={{ color: BRAND.forest }}>
                    +63 906 469 4122
                  </a>
                  <p className="text-base-body text-neutral-500 mt-1">Available 8 AM - 8 PM daily</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-6 rounded-xl border bg-white shadow-sm">
                <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.forest + '20' }}>
                  <Mail className="w-7 h-7" style={{ color: BRAND.forest }} />
                </div>
                <div>
                  <p className="text-h3 text-neutral-600 font-semibold mb-1">Email Us</p>
                  <a href="mailto:smile@memories-studio.com" className="text-h2 font-medium hover:underline block" style={{ color: BRAND.forest }}>
                    smile@memories-studio.com
                  </a>
                  <p className="text-base-body text-neutral-500 mt-1">We respond within 24 hours</p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h2 className="text-h2 font-semibold mb-4" style={{ color: BRAND.forest }}>Follow Us on Social Media</h2>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://www.facebook.com/MemoriesPhotographyStudioPH/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 rounded-lg border hover:shadow-md transition flex-1 min-w-[200px]"
                  style={{ backgroundColor: BRAND.white }}
                >
                  <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <div>
                    <p className="text-h3 font-medium">Facebook</p>
                    <p className="text-base-body text-neutral-500">@MemoriesPhotographyStudioPH</p>
                  </div>
                </a>

                <a 
                  href="https://www.instagram.com/creatingmemoriesphotostudio/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 rounded-lg border hover:shadow-md transition flex-1 min-w-[200px]"
                  style={{ backgroundColor: BRAND.white }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f09433" />
                        <stop offset="25%" stopColor="#e6683c" />
                        <stop offset="50%" stopColor="#dc2743" />
                        <stop offset="75%" stopColor="#cc2366" />
                        <stop offset="100%" stopColor="#bc1888" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <div>
                    <p className="text-h3 font-medium">Instagram</p>
                    <p className="text-base-body text-neutral-500">@creatingmemoriesphotostudio</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl" style={{ backgroundColor: BRAND.cream }}>
              <p className="text-h3 text-neutral-600">
                💬 We typically respond within a few hours during business hours (8 AM - 8 PM)
              </p>
            </div>
          </CardContent>
        </Card>

        <footer className="text-xs text-center text-neutral-500 mt-8">
          © {new Date().getFullYear()} Memories Photography Studio — "Capture With Purpose. Create Change."
        </footer>
      </div>

      {/* Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-5 gap-0">
          <button onClick={() => (window.location.href = "/")} className="flex flex-col items-center justify-center py-2 px-1 transition relative">
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="rounded-lg p-1.5 transition"><ShoppingBag className="w-5 h-5 stroke-2" /></div>
              <span className="text-[10px] mt-1 font-medium">Book</span>
            </div>
          </button>
          <button onClick={() => (window.location.href = "/my-bookings")} className="flex flex-col items-center justify-center py-2 px-1 transition relative">
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="rounded-lg p-1.5 transition"><Calendar className="w-5 h-5 stroke-2" /></div>
              <span className="text-[10px] mt-1 font-medium">Bookings</span>
            </div>
          </button>
          <button onClick={() => (window.location.href = "/contact")} className="flex flex-col items-center justify-center py-2 px-1 transition relative">
            <div className="flex flex-col items-center justify-center text-white dark:text-white">
              <div className="rounded-lg p-1.5 transition bg-[#0b3d2e] dark:bg-[#0b3d2e]"><Phone className="w-5 h-5 stroke-[2.5]" /></div>
              <span className="text-[10px] mt-1 font-semibold text-[#0b3d2e] dark:text-white">Contact</span>
            </div>
          </button>
          <button onClick={() => (window.location.href = "/location")} className="flex flex-col items-center justify-center py-2 px-1 transition relative">
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="rounded-lg p-1.5 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <span className="text-[10px] mt-1 font-medium">Location</span>
            </div>
          </button>
          <button onClick={() => window.open("https://www.memories-studio.com", "_blank")} className="flex flex-col items-center justify-center py-2 px-1 transition relative">
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="rounded-lg p-1.5 transition"><Globe className="w-5 h-5 stroke-2" /></div>
              <span className="text-[10px] mt-1 font-medium">Website</span>
            </div>
          </button>
        </div>
      </div>

      <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-6">
            <button onClick={() => (window.location.href = "/")} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-opacity-80 transition">
              <ShoppingBag className="w-4 h-4" />Book Now
            </button>
            <button onClick={() => (window.location.href = "/my-bookings")} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-opacity-80 transition">
              <Calendar className="w-4 h-4" />My Bookings
            </button>
            <button onClick={() => (window.location.href = "/contact")} className="flex items-center gap-2 text-sm font-semibold text-[#0b3d2e] dark:text-white transition">
              <Phone className="w-4 h-4" />Contact Us
            </button>
            <button onClick={() => (window.location.href = "/location")} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-opacity-80 transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Our Location
            </button>
            <button onClick={() => window.open("https://www.memories-studio.com", "_blank")} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-opacity-80 transition">
              <Globe className="w-4 h-4" />Website
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}