"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Mail, Phone, Search, ArrowLeft, Package, Shield } from "lucide-react";
import { executeRecaptcha } from "@/lib/recaptcha";

const BRAND = {
  charcoal: "#2C2C2C",
  cream: "#FAF3E0",
  white: "#FFFFFF",
  forest: "#0b3d2e",
};

export default function MyBookings() {
  const [searchMethod, setSearchMethod] = useState<"email" | "name">("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

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

      let url = "/api/bookings?";
      if (searchMethod === "email") {
        url += `email=${encodeURIComponent(email)}`;
      } else {
        url += `firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`;
      }

      const response = await fetch(url, {
        headers: {
          "X-Recaptcha-Token": recaptchaToken,
        },
      });
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Failed to search bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function to12Hour(time: string) {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: BRAND.cream }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => (window.location.href = "/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
          <h1 className="text-3xl font-semibold mb-2" style={{ color: BRAND.forest }}>
            My Bookings
          </h1>
          <p className="text-neutral-600">Find and manage your photography session bookings</p>
        </div>

        {/* Search Card */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: BRAND.forest }}>
              Find Your Bookings
            </h2>

            {/* Search Method Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={searchMethod === "email" ? "default" : "outline"}
                onClick={() => setSearchMethod("email")}
                style={{
                  backgroundColor: searchMethod === "email" ? BRAND.forest : "transparent",
                  color: searchMethod === "email" ? BRAND.white : BRAND.charcoal,
                }}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" /> Search by Email
              </Button>
              <Button
                variant={searchMethod === "name" ? "default" : "outline"}
                onClick={() => setSearchMethod("name")}
                style={{
                  backgroundColor: searchMethod === "name" ? BRAND.forest : "transparent",
                  color: searchMethod === "name" ? BRAND.white : BRAND.charcoal,
                }}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" /> Search by Name
              </Button>
            </div>

            {/* Search Form */}
            {searchMethod === "email" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">First Name</label>
                    <Input
                      placeholder="Enter first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Last Name</label>
                    <Input
                      placeholder="Enter last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSearch}
              disabled={
                loading ||
                !recaptchaReady ||
                (searchMethod === "email" ? !email : !firstName || !lastName)
              }
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
                  <Search className="w-4 h-4 mr-2" /> Find My Bookings
                </>
              )}
            </Button>
            {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
              <p className="text-xs text-center text-neutral-500 mt-2 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Protected by reCAPTCHA
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {searched && !loading && (
          <div>
            {bookings.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="p-8 text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-semibold mb-2" style={{ color: BRAND.charcoal }}>
                    No Bookings Found
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    We couldn't find any bookings matching your search.
                  </p>
                  <p className="text-sm text-neutral-500">
                    Please check your email or name spelling and try again.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-4" style={{ color: BRAND.forest }}>
                  Your Bookings ({bookings.length})
                </h2>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card
                      key={booking.id}
                      className="shadow-lg hover:shadow-xl transition cursor-pointer"
                      onClick={() => (window.location.href = `/manage/${booking.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg" style={{ color: BRAND.forest }}>
                              {booking.selections?.service || "Photography Session"}
                            </h3>
                            <p className="text-sm text-neutral-500">
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
                              <p className="text-xs text-neutral-500">Date</p>
                              <p className="text-sm font-medium">
                                {booking.schedule?.date
                                  ? formatDate(booking.schedule.date)
                                  : "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: BRAND.forest }} />
                            <div>
                              <p className="text-xs text-neutral-500">Time</p>
                              <p className="text-sm font-medium">
                                {booking.schedule?.time
                                  ? to12Hour(booking.schedule.time)
                                  : "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" style={{ color: BRAND.forest }} />
                            <div>
                              <p className="text-xs text-neutral-500">Customer</p>
                              <p className="text-sm font-medium">
                                {booking.customer?.firstName} {booking.customer?.lastName}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <div>
                            <p className="text-xs text-neutral-500">Booking ID</p>
                            <p className="text-sm font-mono font-medium">{booking.id}</p>
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
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="text-xs text-center text-neutral-500 mt-8">
          © {new Date().getFullYear()} Memories Photography Studio — "Capture With Purpose.
          Create Change."
        </footer>
      </div>
    </div>
  );
}
