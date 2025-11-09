"use client";
import { useState, useEffect, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Mail, Phone, ArrowLeft, Shield } from "lucide-react";
import { executeRecaptcha } from "@/lib/recaptcha";

const BRAND = {
  charcoal: "#2C2C2C",
  cream: "#FAF3E0",
  white: "#FFFFFF",
  forest: "#0b3d2e",
};

export default function ManageBooking({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const [verifyEmail, setVerifyEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (!otpExpiry) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, otpExpiry - Date.now());
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setOtpSent(false);
        setOtpCode("");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiry]);

  async function sendOTP() {
    if (!verifyEmail) {
      alert('Please enter your email address');
      return;
    }

    setSendingOtp(true);

    try {
      // Get reCAPTCHA token
      let recaptchaToken = "";
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        try {
          recaptchaToken = await executeRecaptcha("request_otp");
        } catch (error) {
          console.warn("reCAPTCHA execution failed:", error);
        }
      }

      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Recaptcha-Token': recaptchaToken,
        },
        body: JSON.stringify({
          email: verifyEmail,
          bookingId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setOtpExpiry(data.expiresAt);
        alert(`✅ Verification code sent to ${verifyEmail}!\n\nCheck your email and enter the 6-digit code below.`);
        
        // In development, show code in console
        if (data.devCode) {
          console.log(`[DEV] OTP Code: ${data.devCode}`);
        }
      } else {
        alert(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      alert('Failed to send verification code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOTPCode() {
    if (!otpCode || otpCode.length !== 6) {
      alert('Please enter the 6-digit verification code');
      return;
    }

    setVerifyingOtp(true);

    try {
      // Get reCAPTCHA token
      let recaptchaToken = "";
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        try {
          recaptchaToken = await executeRecaptcha("verify_otp");
        } catch (error) {
          console.warn("reCAPTCHA execution failed:", error);
        }
      }

      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Recaptcha-Token': recaptchaToken,
        },
        body: JSON.stringify({
          email: verifyEmail,
          bookingId,
          code: otpCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // OTP verified, now fetch booking
        await fetchBooking(verifyEmail);
      } else {
        alert(data.error || 'Invalid verification code');
        setOtpCode(""); // Clear invalid code
      }
    } catch (error) {
      alert('Failed to verify code. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function fetchBooking(email: string) {
    try {
      // Get reCAPTCHA token
      let recaptchaToken = "";
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        try {
          recaptchaToken = await executeRecaptcha("verify_booking");
        } catch (error) {
          console.warn("reCAPTCHA execution failed:", error);
        }
      }

      const response = await fetch(`/api/bookings/${bookingId}?email=${encodeURIComponent(email)}`, {
        headers: {
          "X-Recaptcha-Token": recaptchaToken,
        },
      });
      const data = await response.json();
      if (data.success) {
        setBooking(data.booking);
        setNewDate(data.booking.schedule?.date || "");
        setNewTime(data.booking.schedule?.time || "");
        setEmailVerified(true);
      } else {
        alert(data.error || 'Failed to fetch booking');
      }
    } catch (error) {
      alert('Failed to fetch booking. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule() {
    if (!newDate || !newTime) {
      alert('Please select both date and time');
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verifyEmail,
          updates: { date: newDate, time: newTime }
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Booking rescheduled successfully! You will receive a confirmation email.');
        setEditing(false);
        fetchBooking(verifyEmail);
      }
    } catch (error) {
      alert('Failed to reschedule. Please try again.');
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}?email=${encodeURIComponent(verifyEmail)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Booking cancelled successfully');
        window.location.href = '/';
      }
    } catch (error) {
      alert('Failed to cancel. Please try again.');
    }
  }

  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // OTP verification form
  if (!emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: BRAND.cream }}>
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2" style={{ color: BRAND.forest }}>
                {otpSent ? 'Enter Verification Code' : 'Verify Your Email'}
              </h2>
              <p className="text-neutral-600">
                {otpSent 
                  ? `We sent a 6-digit code to ${verifyEmail}`
                  : 'Enter your email to receive a verification code'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Booking ID</label>
                <Input value={bookingId} disabled className="bg-neutral-100" />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={verifyEmail}
                  onChange={(e) => setVerifyEmail(e.target.value)}
                  disabled={otpSent}
                  className={otpSent ? "bg-neutral-100" : ""}
                />
              </div>

              {!otpSent ? (
                <>
                  <Button
                    onClick={sendOTP}
                    disabled={!verifyEmail || sendingOtp || !recaptchaReady}
                    style={{ backgroundColor: BRAND.forest, color: BRAND.white }}
                    className="w-full"
                  >
                    {sendingOtp ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending Code...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" /> Send Verification Code
                      </>
                    )}
                  </Button>
                  {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                    <p className="text-xs text-center text-neutral-500 flex items-center justify-center gap-1">
                      <Shield className="w-3 h-3" />
                      Protected by reCAPTCHA
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Verification Code</label>
                    <Input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={(e) => e.key === 'Enter' && otpCode.length === 6 && verifyOTPCode()}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest font-mono"
                      autoFocus
                    />
                    {timeRemaining > 0 && (
                      <p className="text-xs text-neutral-500 mt-1 text-center">
                        Code expires in {formatTimeRemaining()}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={verifyOTPCode}
                    disabled={otpCode.length !== 6 || verifyingOtp || timeRemaining === 0}
                    style={{ backgroundColor: BRAND.forest, color: BRAND.white }}
                    className="w-full"
                  >
                    {verifyingOtp ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" /> Verify Code
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode("");
                        setOtpExpiry(0);
                      }}
                      className="text-sm"
                    >
                      Use a different email
                    </Button>
                    {timeRemaining === 0 && (
                      <Button
                        variant="ghost"
                        onClick={sendOTP}
                        disabled={sendingOtp}
                        className="text-sm ml-2"
                        style={{ color: BRAND.forest }}
                      >
                        Resend Code
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={() => window.location.href = '/'}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: BRAND.cream }}>
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2" style={{ color: BRAND.forest }}>Booking Not Found</h2>
            <p className="text-neutral-600 mb-4">
              We couldn't find a booking with ID: <span className="font-mono font-semibold">{bookingId}</span>
            </p>
            <Button onClick={() => window.location.href = '/'} style={{ backgroundColor: BRAND.forest, color: BRAND.white }}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: BRAND.cream }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => window.location.href = '/'} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
          <h1 className="text-3xl font-semibold" style={{ color: BRAND.forest }}>Manage Your Booking</h1>
          <p className="text-neutral-600">Booking ID: <span className="font-mono font-semibold">{bookingId}</span></p>
        </div>

        <Card className="mb-4 shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: BRAND.forest }}>Booking Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <Calendar className="w-5 h-5 mt-1" style={{ color: BRAND.forest }} />
                <div>
                  <p className="text-sm text-neutral-600 font-semibold">Date</p>
                  <p className="font-medium text-lg">{booking.schedule?.date || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <Clock className="w-5 h-5 mt-1" style={{ color: BRAND.forest }} />
                <div>
                  <p className="text-sm text-neutral-600 font-semibold">Time</p>
                  <p className="font-medium text-lg">{booking.schedule?.time || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <User className="w-5 h-5 mt-1" style={{ color: BRAND.forest }} />
                <div className="flex-1">
                  <p className="text-sm text-neutral-600 font-semibold">Service</p>
                  <p className="font-medium">{booking.selections?.service || 'N/A'}</p>
                  <p className="text-sm text-neutral-500">{booking.selections?.serviceType} • {booking.selections?.serviceCategory}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <Mail className="w-5 h-5 mt-1" style={{ color: BRAND.forest }} />
                <div>
                  <p className="text-sm text-neutral-600 font-semibold">Email</p>
                  <p className="font-medium">{booking.customer?.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <Phone className="w-5 h-5 mt-1" style={{ color: BRAND.forest }} />
                <div>
                  <p className="text-sm text-neutral-600 font-semibold">Phone</p>
                  <p className="font-medium">{booking.customer?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {editing && (
          <Card className="mb-4 border-2 shadow-lg" style={{ borderColor: BRAND.forest }}>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-lg" style={{ color: BRAND.forest }}>Reschedule Appointment</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">New Date</label>
                  <Input 
                    type="date" 
                    value={newDate} 
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">New Time</label>
                  <Input 
                    type="time" 
                    value={newTime} 
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleReschedule}
                  style={{ backgroundColor: BRAND.forest, color: BRAND.white }}
                >
                  Confirm Reschedule
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => setEditing(true)}
            disabled={editing}
            style={{ backgroundColor: BRAND.forest, color: BRAND.white }}
            className="flex-1"
          >
            Reschedule Booking
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="border-red-600 text-red-600 hover:bg-red-50 flex-1"
          >
            Cancel Booking
          </Button>
        </div>

        <footer className="text-xs text-center text-neutral-500 mt-8">
          © {new Date().getFullYear()} Memories Photography Studio — "Capture With Purpose. Create Change."
        </footer>
      </div>
    </div>
  );
}