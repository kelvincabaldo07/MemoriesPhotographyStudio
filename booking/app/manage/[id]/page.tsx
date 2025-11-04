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

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  async function fetchBooking() {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      const data = await response.json();
      if (data.success) {
        setBooking(data.booking);
        setNewDate(data.booking.schedule?.date || "");
        setNewTime(data.booking.schedule?.time || "");
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
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
          schedule: { date: newDate, time: newTime }
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Booking rescheduled successfully! You will receive a confirmation email.');
        setEditing(false);
        fetchBooking();
      }
    } catch (error) {
      alert('Failed to reschedule. Please try again.');
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.cream }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: BRAND.forest }}></div>
          <p style={{ color: BRAND.charcoal }}>Loading booking...</p>
        </div>
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