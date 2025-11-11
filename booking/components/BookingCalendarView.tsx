"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Booking {
  id: string; // Notion page ID
  bookingId: string; // Booking ID (MMRS-xxx)
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  serviceCategory: string;
  serviceGroup: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  backdrops: string[];
  backdropAllocations: string;
  backdropOrder: string;
  addons: string[];
  socialConsent: string;
  eventType: string;
  celebrantName: string;
  birthdayAge: string;
  graduationLevel: string;
  eventDate: string;
  sessionPrice: number;
  addonsTotal: number;
  grandTotal: number;
  status: string;
  createdAt: string;
}

interface BookingCalendarViewProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export function BookingCalendarView({ bookings, onBookingClick }: BookingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  // Get today in Manila timezone
  const today = useMemo(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  }, []);

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get bookings for a specific date
  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter(b => b.date === dateStr);
  };

  // Format date display
  const formatDateDisplay = () => {
    const options: Intl.DateTimeFormatOptions = viewMode === 'month' 
      ? { month: 'long', year: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Get week days
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get month days
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Booking Confirmed':
      case 'Attendance Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Access Granted - Ongoing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Access Granted - Completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Cancelled':
      case 'No Show':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-neutral-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="p-2 hover:bg-neutral-100 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium border rounded-lg hover:bg-neutral-50 transition"
          >
            Today
          </button>
          <h2 className="text-xl font-bold text-[#0b3d2e]">{formatDateDisplay()}</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('day')}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition",
              viewMode === 'day' 
                ? 'bg-[#0b3d2e] text-white' 
                : 'border hover:bg-neutral-50'
            )}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition",
              viewMode === 'week' 
                ? 'bg-[#0b3d2e] text-white' 
                : 'border hover:bg-neutral-50'
            )}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition",
              viewMode === 'month' 
                ? 'bg-[#0b3d2e] text-white' 
                : 'border hover:bg-neutral-50'
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'day' && (
          <DayView 
            date={currentDate} 
            bookings={getBookingsForDate(currentDate.toISOString().split('T')[0])}
            onBookingClick={onBookingClick}
            formatTime={formatTime}
            getStatusColor={getStatusColor}
          />
        )}

        {viewMode === 'week' && (
          <WeekView 
            days={getWeekDays()} 
            bookings={bookings}
            today={today}
            onBookingClick={onBookingClick}
            formatTime={formatTime}
            getStatusColor={getStatusColor}
          />
        )}

        {viewMode === 'month' && (
          <MonthView 
            days={getMonthDays()} 
            bookings={bookings}
            today={today}
            onBookingClick={onBookingClick}
          />
        )}
      </div>
    </div>
  );
}

// Day View Component
function DayView({ 
  date, 
  bookings, 
  onBookingClick, 
  formatTime, 
  getStatusColor 
}: any) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b bg-neutral-50">
        <h3 className="font-semibold">
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
      </div>
      <div className="divide-y">
        {hours.map(hour => (
          <div key={hour} className="flex border-l border-r">
            <div className="w-20 p-3 text-sm text-neutral-600 border-r bg-neutral-50">
              {hour % 12 || 12}:00 {hour >= 12 ? 'PM' : 'AM'}
            </div>
            <div className="flex-1 p-2 min-h-[80px]">
              {bookings
                .filter((b: any) => {
                  const bookingHour = parseInt(b.time.split(':')[0]);
                  return bookingHour === hour;
                })
                .map((booking: any) => (
                  <div
                    key={booking.id}
                    onClick={() => onBookingClick(booking)}
                    className={cn(
                      "p-2 mb-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition",
                      getStatusColor(booking.status)
                    )}
                  >
                    <div className="font-medium text-sm">{booking.name}</div>
                    <div className="text-xs text-neutral-600">
                      {formatTime(booking.time)} • {booking.duration} min
                    </div>
                    <div className="text-xs text-neutral-600 truncate">{booking.service}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({ 
  days, 
  bookings, 
  today, 
  onBookingClick, 
  formatTime, 
  getStatusColor 
}: any) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Week header */}
      <div className="grid grid-cols-7 border-b bg-neutral-50">
        {days.map((day: Date, idx: number) => {
          const dateStr = day.toISOString().split('T')[0];
          const isToday = dateStr === today;
          return (
            <div key={idx} className="p-3 text-center border-r last:border-r-0">
              <div className="text-xs text-neutral-600">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={cn(
                "text-lg font-semibold mt-1",
                isToday && "text-[#0b3d2e]"
              )}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 divide-x min-h-[500px]">
        {days.map((day: Date, idx: number) => {
          const dateStr = day.toISOString().split('T')[0];
          const dayBookings = bookings.filter((b: any) => b.date === dateStr);
          
          return (
            <div key={idx} className="p-2 space-y-1 overflow-y-auto max-h-[600px]">
              {dayBookings.map((booking: any) => (
                <div
                  key={booking.id}
                  onClick={() => onBookingClick(booking)}
                  className={cn(
                    "p-2 rounded text-xs cursor-pointer hover:shadow-md transition border-l-2",
                    getStatusColor(booking.status)
                  )}
                >
                  <div className="font-medium truncate">{formatTime(booking.time)}</div>
                  <div className="truncate">{booking.name}</div>
                  <div className="text-[10px] opacity-75 truncate">{booking.service}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Month View Component
function MonthView({ days, bookings, today, onBookingClick }: any) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Month header */}
      <div className="grid grid-cols-7 border-b bg-neutral-50">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="p-3 text-center text-xs font-medium text-neutral-600 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y">
        {days.map((day: Date | null, idx: number) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="min-h-[100px] bg-neutral-25" />;
          }

          const dateStr = day.toISOString().split('T')[0];
          const dayBookings = bookings.filter((b: any) => b.date === dateStr);
          const isToday = dateStr === today;

          return (
            <div key={idx} className="min-h-[100px] p-2 hover:bg-neutral-50 transition">
              <div className={cn(
                "text-sm font-medium mb-1",
                isToday && "inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0b3d2e] text-white"
              )}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayBookings.slice(0, 3).map((booking: any) => (
                  <div
                    key={booking.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingClick(booking);
                    }}
                    className="text-[10px] px-1 py-0.5 rounded bg-[#0b3d2e]/10 text-[#0b3d2e] truncate cursor-pointer hover:bg-[#0b3d2e]/20"
                  >
                    {booking.time} {booking.name}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-[10px] text-neutral-500 pl-1">
                    +{dayBookings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
