"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Mail, Phone, Search, ArrowLeft, Package, Shield, ShoppingBag, Globe, Key } from "lucide-react";
import { executeRecaptcha } from "@/lib/recaptcha";
import { formatTimeTo12Hour, formatManilaDate } from "@/lib/time-utils";

const BRAND = {
  charcoal: "#2C2C2C",
  cream: "#FAF3E0",
  white: "#FFFFFF",
  forest: "#0b3d2e",
};

export default function MyBookings() {
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [error, setError] = useState("");

  // Load reCAPTCHA on mount
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      import("@/lib/recaptcha")
        .then(({ loadRecaptchaScript }) => loadRecaptchaScript())
        .then(() => setRecaptchaReady(true))
        .catch((err) => console.warn("reCAPTCHA load failed:", err));
    } else {
      setRecaptchaReady(true); // Allow without reCAPTCHA in dev
    }
  }, []);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    setError("");
    setBooking(null);

    try {
      // Get reCAPTCHA token
      let recaptchaToken = "";
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        try {
          recaptchaToken = await executeRecaptcha("search_bookings");
        } catch (error) {
          console.warn("reCAPTCHA execution failed:", error);
        }
      }

      // Search by booking ID and email - both must match
      const response = await fetch(
        `/api/bookings/${encodeURIComponent(bookingId)}?email=${encodeURIComponent(email)}`,
        {
          headers: {
            "X-Recaptcha-Token": recaptchaToken,
          },
        }
      );
      const data = await response.json();

      if (data.success && data.booking) {
        setBooking(data.booking);
        setError("");
      } else {
        setBooking(null);
        setError(data.error || "Booking not found. Please check your Booking ID and email.");
      }
    } catch (error) {
      console.error("Failed to search booking:", error);
      setBooking(null);
      setError("Failed to search booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24" style={{ backgroundColor: BRAND.cream }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => (window.location.href = "/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
          <h1 className="text-h1 font-semibold mb-2" style={{ color: BRAND.forest }}>
            My Bookings
          </h1>
          <p className="text-neutral-600">Find and manage your photography session bookings</p>
        </div>

        {/* Search Card */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: BRAND.forest }}>
              Find Your Booking
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              Enter your Booking ID and email address to view and manage your booking. Both must match your booking confirmation.
            </p>

            {/* Search Form */}
            <div className="space-y-4">
              <div>
                <label className="text-h3 font-medium mb-1 block flex items-center gap-2">
                  <Key className="w-4 h-4" style={{ color: BRAND.forest }} />
                  Booking ID
                </label>
                <Input
                  type="text"
                  placeholder="MMRS-XXXXXX"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && bookingId && email && handleSearch()}
                  className="font-mono"
                />
                <p className="text-xs text-neutral-500 mt-1">Found in your booking confirmation email</p>
              </div>

              <div>
                <label className="text-h3 font-medium mb-1 block flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: BRAND.forest }} />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && bookingId && email && handleSearch()}
                />
                <p className="text-xs text-neutral-500 mt-1">The email you used when booking</p>
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading || !recaptchaReady || !bookingId || !email}
              style={{ backgroundColor: BRAND.forest, color: BRAND.white }}
              className="w-full mt-4"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" /> Find My Booking
                </>
              )}
            </Button>
            {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
              <p className="text-base-body text-center text-neutral-500 mt-2 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Protected by reCAPTCHA
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {searched && !loading && (
          <div>
            {error || !booking ? (
              <Card className="shadow-lg">
                <CardContent className="p-8 text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h3 className="text-h2 font-semibold mb-2" style={{ color: BRAND.charcoal }}>
                    {error ? "Booking Not Found" : "No Results"}
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    {error || "Please enter your Booking ID and email to search."}
                  </p>
                  <p className="text-sm text-neutral-500">
                    Make sure both your Booking ID and email match your booking confirmation.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div>
                <h2 className="text-h2 font-semibold mb-4" style={{ color: BRAND.forest }}>
                  Your Booking
                </h2>
                <Card
                  className="shadow-lg hover:shadow-xl transition cursor-pointer"
                  onClick={() => (window.location.href = `/manage/${booking.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg" style={{ color: BRAND.forest }}>
                          {booking.selections?.service || "Photography Session"}
                        </h3>
                        <p className="text-h3 text-neutral-500">
                          {booking.selections?.serviceType} • {booking.selections?.serviceCategory}
                        </p>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor:
                            booking.status === "Confirmed"
                              ? "#10b981"
                              : booking.status === "Pending"
                              ? "#f59e0b"
                              : booking.status === "Cancelled"
                              ? "#ef4444"
                              : "#6b7280",
                          color: BRAND.white,
                        }}
                      >
                        {booking.status || "Pending"}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: BRAND.forest }} />
                        <div>
                          <p className="text-base-body text-neutral-500">Date</p>
                          <p className="text-h3 font-medium">
                            {booking.schedule?.date
                              ? formatManilaDate(booking.schedule.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" style={{ color: BRAND.forest }} />
                        <div>
                          <p className="text-base-body text-neutral-500">Time</p>
                          <p className="text-h3 font-medium">
                            {booking.schedule?.time
                              ? formatTimeTo12Hour(booking.schedule.time)
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" style={{ color: BRAND.forest }} />
                        <div>
                          <p className="text-base-body text-neutral-500">Customer</p>
                          <p className="text-h3 font-medium">
                            {booking.customer?.firstName} {booking.customer?.lastName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div>
                        <p className="text-base-body text-neutral-500">Booking ID</p>
                        <p className="text-h3 font-mono font-medium">{booking.id}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/manage/${booking.id}`;
                        }}
                        style={{ borderColor: BRAND.forest, color: BRAND.forest }}
                      >
                        Manage Booking →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <footer className="text-xs text-center text-neutral-500 mt-8">
          © {new Date().getFullYear()} Memories Photography Studio — "Capture With Purpose.
          Create Change."
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
            <div className="flex flex-col items-center justify-center text-white dark:text-white">
              <div className="rounded-lg p-1.5 transition bg-[#0b3d2e] dark:bg-[#0b3d2e]"><Calendar className="w-5 h-5 stroke-[2.5]" /></div>
              <span className="text-[10px] mt-1 font-semibold text-[#0b3d2e] dark:text-white">Bookings</span>
            </div>
          </button>
          <button onClick={() => (window.location.href = "/contact")} className="flex flex-col items-center justify-center py-2 px-1 transition relative">
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="rounded-lg p-1.5 transition"><Phone className="w-5 h-5 stroke-2" /></div>
              <span className="text-[10px] mt-1 font-medium">Contact</span>
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
            <button onClick={() => (window.location.href = "/my-bookings")} className="flex items-center gap-2 text-sm font-semibold text-[#0b3d2e] dark:text-white transition">
              <Calendar className="w-4 h-4" />My Bookings
            </button>
            <button onClick={() => (window.location.href = "/contact")} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-opacity-80 transition">
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
