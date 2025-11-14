import { useState, useEffect } from 'react';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface ShopHours {
  open: string;
  close: string;
  breaks: TimeSlot[];
  enabled: boolean;
}

interface BlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

type WeekSchedule = {
  [key: string]: ShopHours;
};

interface AvailabilityData {
  schedule: WeekSchedule;
  blockedDates: BlockedDate[];
  timezone: string;
}

export function useAvailability() {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/admin/availability');
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDateBlocked = (date: string): boolean => {
    if (!availability) return false;
    
    return availability.blockedDates.some(blocked => {
      const checkDate = new Date(date);
      const startDate = new Date(blocked.startDate);
      const endDate = new Date(blocked.endDate);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const isTimeSlotAvailable = (date: string, time: string): boolean => {
    if (!availability) return true;
    
    // Check if date is blocked
    if (isDateBlocked(date)) return false;
    
    // Get day of week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = availability.schedule[dayOfWeek];
    
    if (!daySchedule || !daySchedule.enabled) return false;
    
    // Check if time is within working hours
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    const [openHours, openMinutes] = daySchedule.open.split(':').map(Number);
    const openInMinutes = openHours * 60 + openMinutes;
    
    const [closeHours, closeMinutes] = daySchedule.close.split(':').map(Number);
    const closeInMinutes = closeHours * 60 + closeMinutes;
    
    if (timeInMinutes < openInMinutes || timeInMinutes >= closeInMinutes) {
      return false;
    }
    
    // Check if time is during a break
    for (const breakSlot of daySchedule.breaks) {
      const [breakStartHours, breakStartMinutes] = breakSlot.start.split(':').map(Number);
      const breakStartInMinutes = breakStartHours * 60 + breakStartMinutes;
      
      const [breakEndHours, breakEndMinutes] = breakSlot.end.split(':').map(Number);
      const breakEndInMinutes = breakEndHours * 60 + breakEndMinutes;
      
      if (timeInMinutes >= breakStartInMinutes && timeInMinutes < breakEndInMinutes) {
        return false;
      }
    }
    
    return true;
  };

  const getWorkingHours = (dayOfWeek: string): { open: string; close: string; breaks: TimeSlot[] } | null => {
    if (!availability) return null;
    
    const daySchedule = availability.schedule[dayOfWeek];
    if (!daySchedule || !daySchedule.enabled) return null;
    
    return {
      open: daySchedule.open,
      close: daySchedule.close,
      breaks: daySchedule.breaks,
    };
  };

  return {
    availability,
    loading,
    isDateBlocked,
    isTimeSlotAvailable,
    getWorkingHours,
    refetch: fetchAvailability,
  };
}
