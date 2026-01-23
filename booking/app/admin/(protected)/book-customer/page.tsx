"use client";
import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Phone, Mail, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import AdminNav from "@/components/admin/AdminNav";

// Define service structure type
type Service = {
  name: string;
  type: string;
  group: string;
  description: string;
  basePrice: number;
  duration: number;
  enabled: boolean;
  availableFrom?: number;
  availableUntil?: number;
  specificDates?: string[];
  addons?: Array<{ name: string; price: number }>;
};

const STUDIO_TZ = "Asia/Manila";
const SLOT_MINUTES = 15;

// Helper function for proper case
function toProperCase(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(/(\s+|-)/g)
    .map(word => {
      if (word.trim() === "" || word === "-" || word === " ") return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

export default function AdminBookCustomerPage() {
  // Get session for AdminNav
  const { data: session } = useSession();
  
  // Load services
  const [services, setServices] = useState<Service[]>([]);
  
  useEffect(() => {
    // Load services from API or JSON
    fetch('/data/services-config.json')
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(err => console.error('Failed to load services:', err));
  }, []);
  // Form state
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [selectedBackdrops, setSelectedBackdrops] = useState<string[]>([]);
  
  // UI state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [allowOffHours, setAllowOffHours] = useState(false);

  // Get service data
  const serviceConfig = useMemo(() => {
    return services.find(s => s.name === selectedService) || null;
  }, [services, selectedService]);
  
  // Get unique types, groups
  const availableTypes = useMemo(() => {
    return Array.from(new Set(services.map(s => s.type)));
  }, [services]);
  
  const availableGroups = useMemo(() => {
    if (!selectedType) return [];
    return Array.from(new Set(services.filter(s => s.type === selectedType).map(s => s.group)));
  }, [services, selectedType]);
  
  const availableServices = useMemo(() => {
    if (!selectedType || !selectedGroup) return [];
    return services.filter(s => s.type === selectedType && s.group === selectedGroup);
  }, [services, selectedType, selectedGroup]);

  // Calculate pricing
  const pricing = useMemo(() => {
    if (!serviceConfig) return { sessionPrice: 0, addonsTotal: 0, grandTotal: 0 };
    
    const sessionPrice = serviceConfig.basePrice;
    const addonsTotal = Object.entries(selectedAddons).reduce(
      (sum, [addonName, qty]) => {
        const addon = serviceConfig.addons?.find(a => a.name === addonName);
        return sum + (addon ? addon.price * (qty as number) : 0);
      },
      0
    );
    
    return {
      sessionPrice,
      addonsTotal,
      grandTotal: sessionPrice + addonsTotal,
    };
  }, [serviceConfig, selectedAddons]);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchBookedSlots = async () => {
      try {
        const response = await fetch(`/api/calendar/blocked-times?date=${selectedDate}`);
        if (response.ok) {
          const data = await response.json();
          setBookedSlots(data.blockedTimes || []);
        }
      } catch (err) {
        console.error("Error fetching booked slots:", err);
      }
    };
    
    fetchBookedSlots();
  }, [selectedDate]);

  // Generate time slots (with admin override)
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const date = new Date(selectedDate + "T00:00:00");
    const dayOfWeek = date.getDay();
    
    // Default studio hours
    let startHour = 10;
    let endHour = 18;
    
    if (dayOfWeek === 0) { // Sunday
      startHour = 13;
    } else if (dayOfWeek === 6) { // Saturday
      endHour = 18;
    } else { // Monday-Friday
      endHour = 16;
    }
    
    // Admin can override to book any time 00:00-23:45
    if (allowOffHours) {
      startHour = 0;
      endHour = 24;
    }
    
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isBooked = bookedSlots.includes(timeStr);
        slots.push({ time: timeStr, available: !isBooked });
      }
    }
    
    return slots;
  }, [selectedDate, bookedSlots, allowOffHours]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      days.push({ day, date: dateStr, isToday, isPast });
    }
    
    return days;
  }, [currentMonth]);

  const handleSubmit = async () => {
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      setError("Please fill in all customer information");
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      setError("Please select date and time");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const bookingData = {
        customer: {
          firstName: toProperCase(customerInfo.firstName),
          lastName: toProperCase(customerInfo.lastName),
          email: customerInfo.email.toLowerCase(),
          phone: customerInfo.phone,
        },
        selections: {
          serviceType: selectedType,
          serviceCategory: selectedCategory,
          serviceGroup: selectedGroup,
          service: selectedService,
          duration: serviceConfig?.duration || 30,
          description: serviceConfig?.description || "",
        },
        schedule: {
          date: selectedDate,
          time: selectedTime,
        },
        totals: pricing,
        addons: selectedAddons,
        selfShoot: selectedType === "Self-Shoot" ? {
          backdrops: selectedBackdrops,
        } : undefined,
        adminBooking: true, // Flag to skip email verification
        allowOffHours: allowOffHours,
      };
      
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setError(data.error || "Failed to create booking");
      }
    } catch (err) {
      setError("An error occurred while creating the booking");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav session={session} />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-2">Booking Created!</h2>
              <p className="text-gray-600">The booking has been successfully created.</p>
              <p className="text-sm text-gray-500 mt-4">Redirecting...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav session={session} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Book for Customer</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        
        {/* Step 1: Service Selection */}
        {step === 1 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Select Service</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service Type</label>
                  <Select value={selectedType} onValueChange={(val) => {
                    setSelectedType(val);
                    setSelectedGroup("");
                    setSelectedService("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedType && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Group</label>
                    <Select value={selectedGroup} onValueChange={(val) => {
                      setSelectedGroup(val);
                      setSelectedService("");
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGroups.map(group => (
                          <SelectItem key={group} value={group}>{group}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {selectedType && selectedGroup && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Service</label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose service..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map(service => (
                          <SelectItem key={service.name} value={service.name}>
                            {service.name} - ₱{service.basePrice}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {serviceConfig && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <p className="font-semibold mb-2">{serviceConfig.name}</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{serviceConfig.description}</p>
                    <p className="text-lg font-bold mt-2">₱{serviceConfig.basePrice}</p>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => setStep(2)} 
                disabled={!serviceConfig}
                className="mt-6 w-full"
              >
                Next: Schedule
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Step 2: Date & Time */}
        {step === 2 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <h2 className="text-xl font-semibold">Select Date & Time</h2>
                <div className="w-20"></div>
              </div>
              
              {/* Admin Override Toggle */}
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded flex items-center gap-3">
                <Checkbox 
                  checked={allowOffHours}
                  onCheckedChange={(checked) => setAllowOffHours(checked as boolean)}
                  id="offhours"
                />
                <label htmlFor="offhours" className="text-sm font-medium cursor-pointer">
                  Allow booking during off-hours (00:00-23:45)
                </label>
              </div>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <strong>Note:</strong> Double-booking is always prevented. The off-hours toggle only allows booking outside normal business hours.
              </div>
              
              {/* Calendar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="font-semibold">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="font-semibold py-2">{day}</div>
                  ))}
                  {calendarDays.map((day, idx) => (
                    <div key={idx}>
                      {day ? (
                        <button
                          onClick={() => !day.isPast && setSelectedDate(day.date)}
                          disabled={day.isPast}
                          className={`w-full py-2 rounded ${
                            day.isPast
                              ? 'text-gray-300 cursor-not-allowed'
                              : selectedDate === day.date
                              ? 'bg-blue-600 text-white'
                              : day.isToday
                              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {day.day}
                        </button>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <h3 className="font-semibold mb-3">Available Times</h3>
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {timeSlots.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`py-2 px-3 rounded text-sm ${
                          !slot.available
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectedTime === slot.time
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border hover:border-blue-500'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => setStep(3)} 
                disabled={!selectedDate || !selectedTime}
                className="mt-6 w-full"
              >
                Next: Customer Info
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Step 3: Customer Information */}
        {step === 3 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <h2 className="text-xl font-semibold">Customer Information</h2>
                <div className="w-20"></div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <Input
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <Input
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    placeholder="john.doe@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="bg-gray-50 p-4 rounded space-y-2">
                <h3 className="font-semibold">Booking Summary</h3>
                <p className="text-sm"><strong>Service:</strong> {selectedService}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedDate}</p>
                <p className="text-sm"><strong>Time:</strong> {selectedTime}</p>
                <p className="text-sm"><strong>Price:</strong> ₱{pricing.grandTotal.toLocaleString()}</p>
              </div>
              
              <Button 
                onClick={handleSubmit}
                disabled={loading || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone}
                className="mt-6 w-full"
              >
                {loading ? "Creating Booking..." : "Create Booking"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
