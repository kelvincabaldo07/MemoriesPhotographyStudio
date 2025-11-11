"use client";

import { useMemo, useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const BRAND = {
  forest: "#0b3d2e",
  cream: "#FAF3E0",
  white: "#FFFFFF",
};

function to12Hour(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

interface CalendarProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  duration: number;
  serviceType?: string;
  bookingPolicies?: {
    schedulingWindow: number;
    schedulingWindowUnit: 'days' | 'months';
  };
}

export function BookingCalendar({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  duration,
  serviceType = "",
  bookingPolicies = { schedulingWindow: 90, schedulingWindowUnit: 'days' },
}: CalendarProps) {
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availabilityCache, setAvailabilityCache] = useState<Record<string, number>>({});
  const [loadingDates, setLoadingDates] = useState(false);

  // Get today's date in YYYY-MM-DD format (Manila timezone)
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

  // Auto-select today if no date is selected
  useEffect(() => {
    if (!selectedDate) {
      onDateChange(today);
    }
  }, [selectedDate, today, onDateChange]);

  // Generate calendar days based on scheduling window
  const futureQDays = useMemo(() => {
    const days: string[] = [];
    const start = new Date(today);

    let daysToGenerate = bookingPolicies.schedulingWindow;
    if (bookingPolicies.schedulingWindowUnit === 'months') {
      daysToGenerate = bookingPolicies.schedulingWindow * 30;
    }

    for (let i = 0; i < daysToGenerate; i++) {
      const dateObj = new Date(start);
      dateObj.setDate(start.getDate() + i);
      days.push(dateObj.toISOString().split('T')[0]);
    }
    return days;
  }, [today, bookingPolicies]);

  // Current month view state
  const [currentMonth, setCurrentMonth] = useState(new Date(today));

  // Get calendar grid for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (string | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push(dateStr);
    }

    return days;
  }, [currentMonth]);

  // Pre-fetch availability for future days
  useEffect(() => {
    if (!duration) return;
    if (!bookingPolicies.schedulingWindow) return;
    if (Object.keys(availabilityCache).length > 0) return;

    setLoadingDates(true);

    fetch('/api/calendar/availability-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates: futureQDays, duration })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const cache: Record<string, number> = {};
          data.results.forEach(({ date, count }: { date: string; count: number }) => {
            cache[date] = count;
          });
          setAvailabilityCache(cache);
        }
      })
      .catch(err => console.error('Failed to load availability:', err))
      .finally(() => setLoadingDates(false));
  }, [duration, bookingPolicies, futureQDays, availabilityCache]);

  // Fetch slots for selected date
  useEffect(() => {
    if (!selectedDate || !duration) return;

    setLoading(true);

    const cacheKey = `${selectedDate}-${duration}`;
    const cachedSlots = sessionStorage.getItem(cacheKey);
    if (cachedSlots) {
      setAvailableSlots(JSON.parse(cachedSlots));
      setLoading(false);
      return;
    }

    fetch(`/api/calendar/availability?date=${selectedDate}&duration=${duration}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          sessionStorage.setItem(cacheKey, JSON.stringify(data.availableSlots));
          setAvailableSlots(data.availableSlots);
        } else {
          setAvailableSlots([]);
        }
      })
      .catch(err => {
        console.error('Error fetching availability:', err);
        setAvailableSlots([]);
      })
      .finally(() => setLoading(false));
  }, [selectedDate, duration]);

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left: Calendar */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Date</h3>

        <div className="border rounded-xl p-4 bg-white">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-neutral-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-semibold">{formatMonthYear(currentMonth)}</h3>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-neutral-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, idx) => {
              if (!d) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const availableCount = availabilityCache[d] || 0;
              const isPastDate = d < today;
              const isFullyBooked = availableCount === 0 || isPastDate;
              const isSelected = selectedDate === d;
              const isToday = d === today;

              return (
                <button
                  key={d}
                  onClick={() => {
                    if (!isFullyBooked) {
                      onDateChange(d);
                      onTimeChange('');
                    }
                  }}
                  disabled={isFullyBooked}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition relative",
                    isSelected && "bg-[#0b3d2e] text-white shadow-md",
                    !isSelected && !isFullyBooked && "hover:bg-neutral-100 text-neutral-900",
                    isFullyBooked && "text-neutral-300 cursor-not-allowed",
                    isToday && !isSelected && "border-2 border-[#0b3d2e]"
                  )}
                >
                  {d.split('-')[2]}
                  {!isFullyBooked && availableCount > 0 && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0b3d2e]" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-neutral-500 mt-4 text-center">
            Time zone: Asia/Manila
          </p>
        </div>
      </div>

      {/* Right: Time Slots */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {selectedDate ? formatDateDisplay(selectedDate) : 'Select a date'}
        </h3>

        {!selectedDate && (
          <div className="border rounded-xl p-8 bg-neutral-50 text-center text-neutral-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Please select a date to view available times</p>
          </div>
        )}

        {selectedDate && loading && (
          <div className="border rounded-xl p-8 bg-white text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0b3d2e]" />
            <p className="text-sm text-neutral-600">Loading available times...</p>
          </div>
        )}

        {selectedDate && !loading && (
          <div className="border rounded-xl bg-white overflow-hidden">
            <div className="p-3 bg-neutral-50 border-b">
              <p className="text-xs text-neutral-600">
                {duration} minute session • Manila Time
              </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
              {availableSlots.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  <XCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No available times</p>
                  <p className="text-xs mt-1">
                    {selectedDate === today
                      ? "Try selecting a future date"
                      : "Please choose another day"}
                  </p>
                </div>
              )}

              {availableSlots.map((s) => (
                <button
                  key={s}
                  onClick={() => onTimeChange(s)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition border",
                    selectedTime === s && "bg-[#0b3d2e] text-white border-[#0b3d2e] shadow-sm",
                    selectedTime !== s && "bg-white text-neutral-900 border-neutral-200 hover:border-[#0b3d2e] hover:bg-neutral-50"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  {to12Hour(s)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
