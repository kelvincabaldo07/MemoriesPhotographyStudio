"use client";
import { useState, useEffect, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Mail, Phone, ArrowLeft } from "lucide-react";

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
  const [emailVerified, setEmailVerified] = useState(false);

  async function fetchBooking(email: string) {
    try {
      const response = await fetch(`/api/bookings/${bookingId}?email=${encodeURIComponent(email)}`);
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

  // Email verification form
  if (!emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: BRAND.cream }}>
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2" style={{ color: BRAND.forest }}>Verify Your Email</h2>
              <p className="text-neutral-600">
                Please enter the email address used for this booking to continue.
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
                  onKeyDown={(e) => e.key === 'Enter' && verifyEmail && fetchBooking(verifyEmail)}
                />
              </div>
              <Button
                onClick={() => fetchBooking(verifyEmail)}
                disabled={!verifyEmail || loading}
                style={{ backgroundColor: BRAND.forest, color: BRAND.white }}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" /> Verify & Continue
                  </>
                )}
              </Button>
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