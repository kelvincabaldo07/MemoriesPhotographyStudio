"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeTo12Hour, formatManilaDate } from "@/lib/time-utils";
import { BookingCalendar } from "@/components/Calendar";
import { BookingCalendarView } from "@/components/BookingCalendarView";
import { useAvailability } from "@/lib/useAvailability";
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Clock, 
  Mail, 
  Phone,
  DollarSign,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X as CloseIcon,
  Users,
  Package,
  Layers,
  Tag,
  List,
  CalendarDays,
  TrendingUp,
  ChevronRight
} from "lucide-react";

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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("today");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("All");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>("All");
  const [serviceFilter, setServiceFilter] = useState<string>("All");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<{date: string, slots: string[]}>({date: "", slots: []});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // Fetch availability settings
  const availabilityData = useAvailability();
  
  // Service options from Notion
  const [serviceOptions, setServiceOptions] = useState<{
    types: string[];
    categories: string[];
    groupsByType: Record<string, string[]>;
    servicesByGroup: Record<string, Array<{ name: string; duration: number; price: number; category?: string }>>;
  }>({
    types: [],
    categories: [],
    groupsByType: {},
    servicesByGroup: {},
  });

  useEffect(() => {
    fetchBookings();
    fetchServiceOptions();
    // Set today as default date range
    applyTimeRangeFilter('today');
  }, []);

  const fetchServiceOptions = async () => {
    try {
      const response = await fetch("/api/admin/services/options");
      const data = await response.json();
      if (data.types) {
        setServiceOptions(data);
      }
    } catch (error) {
      console.error("Error fetching service options:", error);
    }
  };

  // Check availability when edit mode is enabled
  useEffect(() => {
    if (isEditing && editedBooking?.date && editedBooking?.duration) {
      checkAvailability(editedBooking.date, editedBooking.duration);
    }
  }, [isEditing]);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/admin/bookings");
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchBookings();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking({ ...selectedBooking, status: newStatus });
        }
        alert(`Booking ${newStatus.toLowerCase()} successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update booking status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Error updating booking");
    } finally {
      setUpdating(false);
    }
  };

  const checkAvailability = async (date: string, duration: number) => {
    if (!date || !duration) return;
    
    setCheckingAvailability(true);
    try {
      const response = await fetch(`/api/calendar/availability?date=${date}&duration=${duration}`);
      const data = await response.json();
      
      if (response.ok && data.available) {
        setAvailabilitySlots({ date, slots: data.slots || [] });
      } else {
        setAvailabilitySlots({ date, slots: [] });
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailabilitySlots({ date, slots: [] });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This will:\n\n• Update the status to "Cancelled" in Notion\n• Delete the Google Calendar event\n\nThis action cannot be undone.')) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchBookings();
        setSelectedBooking(null);
        alert('Booking cancelled successfully! Calendar event has been deleted.');
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel booking: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Error cancelling booking");
    } finally {
      setUpdating(false);
    }
  };

  const handleReschedule = async (bookingId: string, newDate: string, newTime: string) => {
    console.log('[Reschedule] Starting:', { bookingId, newDate, newTime });
    try {
      // Find the booking to get its current details
      const booking = bookings.find(b => b.bookingId === bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate,
          time: newTime,
          // Include other required fields to ensure update works
          name: booking.name,
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phone: booking.phone,
          service: booking.service,
          serviceType: booking.serviceType,
          serviceCategory: booking.serviceCategory,
          serviceGroup: booking.serviceGroup,
          duration: booking.duration,
          sessionPrice: booking.sessionPrice,
        }),
      });

      if (response.ok) {
        await fetchBookings();
        console.log('[Reschedule] Success!');
        alert('Booking rescheduled successfully!');
      } else {
        const errorData = await response.json();
        console.error('[Reschedule] API Error:', errorData);
        throw new Error(errorData.error || 'Failed to reschedule');
      }
    } catch (error) {
      console.error("[Reschedule] Error:", error);
      throw error;
    }
  };

  const saveBookingChanges = async () => {
    if (!editedBooking) return;

    console.log('💾 Saving booking changes:', editedBooking);
    setUpdating(true);
    try {
      // Admin update - send booking ID in URL and updates in body
      const response = await fetch(`/api/admin/bookings/${editedBooking.bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedBooking.name,
          firstName: editedBooking.firstName,
          lastName: editedBooking.lastName,
          email: editedBooking.email,
          phone: editedBooking.phone,
          address: editedBooking.address,
          date: editedBooking.date,
          time: editedBooking.time,
          status: editedBooking.status,
          service: editedBooking.service,
          serviceType: editedBooking.serviceType,
          serviceCategory: editedBooking.serviceCategory,
          serviceGroup: editedBooking.serviceGroup,
          duration: editedBooking.duration,
          addons: editedBooking.addons || [],
          backdrops: editedBooking.backdrops || [],
          backdropOrder: editedBooking.backdropOrder,
          backdropAllocations: editedBooking.backdropAllocations,
          sessionPrice: editedBooking.sessionPrice,
        }),
      });

      if (response.ok) {
        await fetchBookings();
        setSelectedBooking(editedBooking);
        setIsEditing(false);
        alert("Booking updated successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to update booking: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Error saving booking");
    } finally {
      setUpdating(false);
    }
  };

  // Set date range based on time filter selection
  const applyTimeRangeFilter = (range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    setTimeRangeFilter(range);
    
    switch (range) {
      case "today":
        const todayStr = today.toISOString().split('T')[0];
        setStartDateFilter(todayStr);
        setEndDateFilter(todayStr);
        break;
      case "week":
        // Get Monday of this week
        const weekStart = new Date(today);
        const dayOfWeek = weekStart.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, else go to Monday
        weekStart.setDate(weekStart.getDate() + diff);
        // Get Sunday of this week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        setStartDateFilter(weekStart.toISOString().split('T')[0]);
        setEndDateFilter(weekEnd.toISOString().split('T')[0]);
        break;
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDateFilter(monthStart.toISOString().split('T')[0]);
        setEndDateFilter(monthEnd.toISOString().split('T')[0]);
        break;
      case "year":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);
        setStartDateFilter(yearStart.toISOString().split('T')[0]);
        setEndDateFilter(yearEnd.toISOString().split('T')[0]);
        break;
      default: // "all"
        setStartDateFilter("");
        setEndDateFilter("");
        break;
    }
  };

  // Filter bookings by date range
  const getFilteredByTimeRange = () => {
    return bookings.filter((booking) => {
      // If no date filters set, show all
      if (!startDateFilter && !endDateFilter) return true;
      
      const bookingDate = booking.date;
      
      // Check if booking falls within date range
      if (startDateFilter && bookingDate < startDateFilter) return false;
      if (endDateFilter && bookingDate > endDateFilter) return false;
      
      return true;
    });
  };

  const filteredBookings = getFilteredByTimeRange()
    .filter((booking) => {
      const matchesSearch =
        booking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.phone.includes(searchQuery);
      
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(booking.status);
      
      const matchesServiceType = 
        serviceTypeFilter === "All" || booking.serviceType === serviceTypeFilter;
      
      const matchesServiceCategory =
        serviceCategoryFilter === "All" || booking.serviceCategory === serviceCategoryFilter;
      
      const matchesService = serviceFilter === "All" || booking.service === serviceFilter;

      return matchesSearch && matchesStatus && matchesServiceType && 
             matchesServiceCategory && matchesService;
    })
    .sort((a, b) => {
      // Sort by date (ascending), then by time (ascending)
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // Compare times if dates are the same (earliest first)
      return a.time.localeCompare(b.time);
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "Completed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateStr: string) => {
    return formatManilaDate(dateStr, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const timeRangeFilteredBookings = getFilteredByTimeRange();

  // Helper to check if status counts for revenue
  const isConfirmedStatus = (status: string) => {
    const confirmedStatuses = [
      "Booking Confirmed",
      "Attendance Confirmed", 
      "Session Completed",
      "RAW Photos Sent",
      "Final Deliverables Sent",
      "Access Granted - Completed"
    ];
    return confirmedStatuses.includes(status);
  };

  const stats = {
    total: timeRangeFilteredBookings.length,
    confirmed: timeRangeFilteredBookings.filter((b) => b.status === "Booking Confirmed").length,
    pending: timeRangeFilteredBookings.filter((b) => b.status === "Pending").length,
    revenue: timeRangeFilteredBookings
      .filter((b) => isConfirmedStatus(b.status))
      .reduce((sum, b) => sum + b.grandTotal, 0),
  };

  const uniqueServiceTypes = ["All", ...Array.from(new Set(bookings.map(b => b.serviceType)))];
  const uniqueServiceCategories = ["All", ...Array.from(new Set(bookings.map(b => b.serviceCategory)))];
  const uniqueServices = ["All", ...Array.from(new Set(bookings.map(b => b.service)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0b3d2e] hidden md:block">Bookings</h1>
          <p className="text-neutral-600 mt-1 text-sm">
            Manage all studio bookings and reservations
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium transition ${
                viewMode === 'list' 
                  ? 'bg-[#0b3d2e] text-white' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm font-medium transition ${
                viewMode === 'calendar' 
                  ? 'bg-[#0b3d2e] text-white' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
          <Button className="bg-[#0b3d2e] hover:bg-[#0a3426] text-xs md:text-sm">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: "all", label: "All Time" },
          { value: "today", label: "Today" },
          { value: "week", label: "This Week" },
          { value: "month", label: "This Month" },
          { value: "year", label: "This Year" },
        ].map((range) => (
          <Button
            key={range.value}
            variant={timeRangeFilter === range.value ? "default" : "outline"}
            size="sm"
            onClick={() => applyTimeRangeFilter(range.value)}
            className={`whitespace-nowrap ${
              timeRangeFilter === range.value
                ? "bg-[#0b3d2e] hover:bg-[#0a3426]"
                : ""
            }`}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Summary - Dashboard Style */}
      <div>
        <h2 className="text-lg font-semibold text-[#0b3d2e] mb-3">Summary</h2>
        <Card className="p-6">
          <div className="grid grid-cols-4 gap-4 lg:gap-6">
            {/* Total Bookings */}
            <div className="text-center border-r last:border-r-0 border-border">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-1">Bookings</p>
                <p className="text-xl lg:text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>

            {/* Revenue */}
            <div className="text-center border-r last:border-r-0 border-border">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-1">Revenue</p>
                <p className="text-xl lg:text-3xl font-bold text-foreground">₱{stats.revenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Customers */}
            <div className="text-center border-r last:border-r-0 border-border">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-1">Customers</p>
                <p className="text-xl lg:text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>

            {/* Avg. Value */}
            <div className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-1">Avg. Value</p>
                <p className="text-xl lg:text-3xl font-bold text-foreground">
                  ₱{stats.total > 0 ? Math.round(stats.revenue / stats.total).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filters */}
          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-2 block">Status Filter</label>
            <details className="relative border rounded-lg">
              <summary className="px-4 py-2.5 cursor-pointer hover:bg-gray-50 flex items-center justify-between text-base">
                <span>
                  {statusFilter.length === 0 ? 'All Statuses' : `${statusFilter.length} selected`}
                </span>
                <ChevronRight className="w-4 h-4" />
              </summary>
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                {statusFilter.length > 0 && (
                  <button
                    onClick={() => setStatusFilter([])}
                    className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border-b"
                  >
                    Clear All ({statusFilter.length})
                  </button>
                )}
                {["Booking Confirmed", "Attendance Confirmed", "Session Completed", "RAW Photos Sent", "Final Deliverables Sent", "Access Granted - Completed", "No Show", "Cancelled", "Rescheduled"].map((status) => (
                  <label key={status} className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-base">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStatusFilter([...statusFilter, status]);
                        } else {
                          setStatusFilter(statusFilter.filter(s => s !== status));
                        }
                      }}
                      className="mr-3 w-4 h-4"
                    />
                    {status}
                  </label>
                ))}
              </div>
            </details>
          </div>

          {/* Service Filters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Start Date
              </label>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                  setTimeRangeFilter(""); // Clear preset when manually selecting
                }}
                placeholder="From date"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                End Date
              </label>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setTimeRangeFilter(""); // Clear preset when manually selecting
                }}
                placeholder="To date"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Service Type
              </label>
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {uniqueServiceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Category
              </label>
              <select
                value={serviceCategoryFilter}
                onChange={(e) => setServiceCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {uniqueServiceCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Service
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {uniqueServices.map((svc) => (
                  <option key={svc} value={svc}>{svc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Bookings List - Mobile Optimized */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-neutral-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b3d2e] mx-auto"></div>
            <p className="mt-4">Loading bookings...</p>
          </Card>
        ) : viewMode === 'calendar' ? (
          <BookingCalendarView 
            bookings={filteredBookings}
            onBookingClick={(booking) => {
              // Create a deep copy to avoid reference issues
              const bookingCopy = JSON.parse(JSON.stringify(booking));
              setSelectedBooking(bookingCopy);
              setEditedBooking(bookingCopy);
              setIsEditing(false);
            }}
            onReschedule={handleReschedule}
            availability={availabilityData.loading ? undefined : availabilityData}
          />
        ) : filteredBookings.length === 0 ? (
          <Card className="p-8 text-center text-neutral-600">
            <Calendar className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <p>No bookings found</p>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card
              key={booking.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                // Create deep copy with all fields properly set
                const bookingCopy = {
                  ...booking,
                  serviceGroup: booking.serviceGroup || '',
                  service: booking.service || '',
                  firstName: booking.firstName || '',
                  lastName: booking.lastName || ''
                };
                console.log('📋 Opening booking from list:', bookingCopy);
                setSelectedBooking(bookingCopy);
                setEditedBooking(bookingCopy);
                setIsEditing(false);
              }}
            >
              <div className="space-y-2">
                {/* Date & Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base">
                    <Calendar className="w-4 h-4 text-[#0b3d2e]" />
                    <span className="font-semibold text-base">{formatDate(booking.date)}</span>
                    <Clock className="w-4 h-4 text-neutral-500 ml-2" />
                    <span className="text-neutral-600">{formatTimeTo12Hour(booking.time)}</span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>

                {/* Customer Info */}
                <div>
                  <p className="font-bold text-lg text-[#0b3d2e]">{booking.name}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-base text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {booking.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {booking.phone}
                    </span>
                  </div>
                </div>

                {/* Service Info */}
                <div className="space-y-1 text-base">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div>
                      <span className="text-neutral-600">Service Type: </span>
                      <span className="font-medium">{booking.serviceType}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Layers className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div>
                      <span className="text-neutral-600">Category: </span>
                      <span className="font-medium">{booking.serviceCategory}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div>
                      <span className="text-neutral-600">Service: </span>
                      <span className="font-medium">{booking.service}</span>
                    </div>
                  </div>
                </div>

                {/* Add-ons and Backdrops */}
                {(booking.addons.length > 0 || booking.backdrops.length > 0) && (
                  <div className="space-y-1 text-base pt-2 border-t">
                    {booking.addons.length > 0 && (
                      <div className="flex items-start gap-1">
                        <span className="text-neutral-600">Add-ons:</span>
                        <span className="text-neutral-800">{booking.addons.join(", ")}</span>
                      </div>
                    )}
                    {booking.backdrops.length > 0 && (
                      <div className="flex items-start gap-1">
                        <span className="text-neutral-600">Backdrops:</span>
                        <span className="text-neutral-800">{booking.backdrops.join(", ")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-base text-neutral-600">Total</span>
                  <span className="text-xl font-bold text-[#0b3d2e]">
                    ₱{booking.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedBooking(null);
            setIsEditing(false);
          }}
        >
          <Card
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#0b3d2e]">
                  Booking Details
                </h2>
                <div className="flex items-center gap-2">
                  {!isEditing && selectedBooking.status !== "Access Granted - Completed" && selectedBooking.status !== "Cancelled" && selectedBooking.status !== "No Show" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      disabled={updating}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(null);
                      setIsEditing(false);
                    }}
                  >
                    <CloseIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-base font-semibold text-neutral-700">Customer Name</label>
                    {isEditing ? (
                      <Input
                        value={editedBooking?.name || ""}
                        onChange={(e) =>
                          setEditedBooking({ ...editedBooking!, name: e.target.value })
                        }
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{selectedBooking.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-base font-semibold text-neutral-700">Email</label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedBooking?.email || ""}
                        onChange={(e) =>
                          setEditedBooking({ ...editedBooking!, email: e.target.value })
                        }
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{selectedBooking.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-base font-semibold text-neutral-700">Phone</label>
                    {isEditing ? (
                      <Input
                        value={editedBooking?.phone || ""}
                        onChange={(e) =>
                          setEditedBooking({ ...editedBooking!, phone: e.target.value })
                        }
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{selectedBooking.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-base font-semibold text-neutral-700">Address</label>
                    {isEditing ? (
                      <Input
                        value={editedBooking?.address || ""}
                        onChange={(e) =>
                          setEditedBooking({ ...editedBooking!, address: e.target.value })
                        }
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{selectedBooking.address || "N/A"}</p>
                    )}
                  </div>
                </div>
                {/* Service Details */}
                <div className="border-t pt-4">
                  <h3 className="text-xl font-bold text-[#0b3d2e] mb-3">Service Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-base font-semibold text-neutral-700">Service Type</label>
                      {isEditing ? (
                        <select
                          value={editedBooking?.serviceType || ""}
                          onChange={(e) => {
                            const newType = e.target.value;
                            // Auto-set category based on type
                            const autoCategory = (newType === "With Photographer" || newType === "Seasonal Sessions") 
                              ? "Digital" 
                              : editedBooking?.serviceCategory || "";
                            
                            setEditedBooking({ 
                              ...editedBooking!, 
                              serviceType: newType,
                              serviceCategory: autoCategory,
                              serviceGroup: "", // Reset group when type changes
                              service: "", // Reset service when type changes
                              duration: 30 // Reset duration
                            });
                          }}
                          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="">Select Type</option>
                          {serviceOptions.types.map((type) => (
                            <option key={type} value={type} className="text-sm">{type}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="mt-1">{selectedBooking.serviceType}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-700">Category</label>
                      {isEditing ? (
                        <>
                          {(editedBooking?.serviceType === "With Photographer" || editedBooking?.serviceType === "Seasonal Sessions") ? (
                            <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-lg text-gray-600">
                              Digital (Auto-selected)
                            </div>
                          ) : (
                            <select
                              value={editedBooking?.serviceCategory || ""}
                              onChange={(e) => {
                                const newCategory = e.target.value;
                                setEditedBooking({ 
                                  ...editedBooking!, 
                                  serviceCategory: newCategory,
                                  serviceGroup: "",
                                  service: "",
                                  duration: 30
                                });
                              }}
                              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                              disabled={!editedBooking?.serviceType}
                            >
                              <option value="">Select Category</option>
                              {serviceOptions.categories.map((category) => (
                                <option key={category} value={category} className="text-sm">{category}</option>
                              ))}
                            </select>
                          )}
                        </>
                      ) : (
                        <p className="mt-1">{selectedBooking.serviceCategory}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-700">Service Group</label>
                      {isEditing ? (
                        <select
                          value={editedBooking?.serviceGroup || ""}
                          onChange={(e) => {
                            const newGroup = e.target.value;
                            setEditedBooking({ 
                              ...editedBooking!, 
                              serviceGroup: newGroup,
                              service: "", // Reset service when group changes
                              duration: 30 // Reset duration
                            });
                          }}
                          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                          disabled={!editedBooking?.serviceType || !editedBooking?.serviceCategory}
                        >
                          <option value="">Select Group</option>
                          {editedBooking?.serviceType && editedBooking?.serviceCategory && 
                            serviceOptions.groupsByType[editedBooking.serviceType]
                              ?.filter(group => {
                                // Only show groups that have services in the selected category
                                const servicesInGroup = serviceOptions.servicesByGroup[group] || [];
                                return servicesInGroup.some(s => s.category === editedBooking.serviceCategory);
                              })
                              .map((group) => (
                                <option key={group} value={group} className="text-sm">{group}</option>
                              ))
                          }
                        </select>
                      ) : (
                        <p className="mt-1">{selectedBooking.serviceGroup || "N/A"}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-semibold text-neutral-700">Service Package</label>
                      {isEditing ? (
                        <select
                          value={editedBooking?.service || ""}
                          onChange={(e) => {
                            const serviceName = e.target.value;
                            // Filter services by category
                            const filteredServices = editedBooking?.serviceGroup 
                              ? serviceOptions.servicesByGroup[editedBooking.serviceGroup]?.filter(s => 
                                  s.category === editedBooking.serviceCategory
                                )
                              : [];
                            
                            const serviceData = filteredServices?.find(s => s.name === serviceName);
                            
                            setEditedBooking({ 
                              ...editedBooking!, 
                              service: serviceName,
                              duration: serviceData?.duration || editedBooking?.duration || 30,
                              sessionPrice: serviceData?.price || editedBooking?.sessionPrice || 0
                            });
                            
                            // Trigger availability check if date is set
                            if (editedBooking?.date && serviceData?.duration) {
                              checkAvailability(editedBooking.date, serviceData.duration);
                            }
                          }}
                          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                          disabled={!editedBooking?.serviceGroup || !editedBooking?.serviceCategory}
                        >
                          <option value="">Select Service</option>
                          {editedBooking?.serviceGroup && editedBooking?.serviceCategory && 
                            serviceOptions.servicesByGroup[editedBooking.serviceGroup]
                              ?.filter(service => service.category === editedBooking.serviceCategory)
                              .map((service) => (
                                <option key={service.name} value={service.name} className="text-sm">
                                  {service.name} ({service.duration} min - ₱{service.price})
                                </option>
                              ))
                          }
                        </select>
                      ) : (
                        <p className="mt-1">{selectedBooking.service}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-700">Duration (minutes)</label>
                      {isEditing ? (
                        <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-lg text-gray-600">
                          {editedBooking?.duration || 30} minutes (Auto-set by service)
                        </div>
                      ) : (
                        <p className="mt-1">{selectedBooking.duration} minutes</p>
                      )}
                    </div>
                  </div>

                  {/* Date & Time Picker - Full Width Calendar */}
                  {isEditing ? (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-neutral-700 mb-4">Select Date & Time</h4>
                      <BookingCalendar
                        selectedDate={editedBooking?.date || ""}
                        selectedTime={editedBooking?.time || ""}
                        onDateChange={(date) => {
                          console.log('📆 Admin onDateChange called:', { date, currentDate: editedBooking?.date });
                          setEditedBooking(prev => ({ ...prev!, date }));
                        }}
                        onTimeChange={(time) => {
                          console.log('⏰ Admin onTimeChange called:', { time });
                          setEditedBooking(prev => ({ ...prev!, time }));
                        }}
                        duration={editedBooking?.duration || 30}
                        serviceType={editedBooking?.serviceType || ""}
                        bookingPolicies={{ schedulingWindow: 90, schedulingWindowUnit: 'days' }}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div>
                        <label className="text-sm font-semibold text-neutral-700">Date</label>
                        <p className="mt-1">{formatDate(selectedBooking.date)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-neutral-700">Time (Manila Time)</label>
                        <p className="mt-1">{formatTimeTo12Hour(selectedBooking.time)}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                  </div>
                </div>
                
                {/* Add-ons & Backdrops Section */}
                {isEditing && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-bold text-[#0b3d2e] mb-3">Add-ons & Extras</h3>
                    
                    {/* Add-ons */}
                    <div className="mb-4">
                      <label className="text-sm font-semibold text-neutral-700 mb-2 block">Add-ons</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "4r", label: "Printed 1 4R photo", price: 30 },
                          { id: "photostrip", label: "Printed 2 photo strips", price: 30 },
                          { id: "wallet", label: "Printed 4 wallet size photos", price: 30 },
                          { id: "premium4r", label: "Printed 1 4R photo (Canon Selphy CP1500)", price: 50 },
                        ].map((addon) => {
                          const currentQty = editedBooking?.addons?.filter(a => a === addon.id).length || 0;
                          return (
                            <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{addon.label}</p>
                                <p className="text-xs text-neutral-500">₱{addon.price} each</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditedBooking(prev => {
                                      const newAddons = [...(prev?.addons || [])];
                                      const index = newAddons.lastIndexOf(addon.id);
                                      if (index > -1) {
                                        newAddons.splice(index, 1);
                                      }
                                      return { ...prev!, addons: newAddons };
                                    });
                                  }}
                                  disabled={currentQty === 0}
                                  className="w-8 h-8 rounded-full border bg-white hover:bg-gray-50 disabled:opacity-30 text-sm"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-medium text-sm">{currentQty}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditedBooking(prev => {
                                      const newAddons = [...(prev?.addons || []), addon.id];
                                      return { ...prev!, addons: newAddons };
                                    });
                                  }}
                                  className="w-8 h-8 rounded-full border bg-white hover:bg-gray-50 text-sm"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Backdrops (for Self-Shoot only) */}
                    {editedBooking?.serviceType === "Self-Shoot" && (
                      <div>
                        <label className="text-sm font-semibold text-neutral-700 mb-2 block">Backdrops</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: "gray", name: "Gray" },
                            { key: "mugwort", name: "Mugwort" },
                            { key: "beige", name: "Beige" },
                            { key: "ivory", name: "Ivory" },
                            { key: "lightblue", name: "Light Blue" },
                            { key: "flamered", name: "Flame Red" },
                            { key: "carnationpink", name: "Carnation Pink" },
                          ].map((backdrop) => {
                            // Check both lowercase key and proper case name for backwards compatibility
                            const isSelected = editedBooking?.backdrops?.some(b => 
                              b.toLowerCase() === backdrop.key.toLowerCase() || 
                              b.toLowerCase() === backdrop.name.toLowerCase()
                            );
                            const maxBackdrops = editedBooking?.duration && editedBooking.duration >= 60 ? 4 : 2;
                            const currentCount = editedBooking?.backdrops?.length || 0;
                            // Disable if not selected AND we're already at max
                            const isDisabled = !isSelected && currentCount >= maxBackdrops;
                            
                            // Debug logging for all backdrops when count >= 3
                            if (currentCount >= 3) {
                              console.log(`🎨 ${backdrop.name}:`, { 
                                isSelected, 
                                currentCount, 
                                maxBackdrops, 
                                isDisabled,
                                backdrops: editedBooking?.backdrops
                              });
                            }
                            
                            return (
                              <button
                                key={backdrop.key}
                                type="button"
                                onClick={() => {
                                  console.log('Backdrop click START:', { 
                                    backdrop: backdrop.name, 
                                    isSelected, 
                                    currentBackdrops: editedBooking?.backdrops,
                                    currentCount, 
                                    maxBackdrops 
                                  });
                                  setEditedBooking(prev => {
                                    const newBackdrops = isSelected
                                      // Remove by matching both key and name (case insensitive)
                                      ? prev!.backdrops.filter(b => 
                                          b.toLowerCase() !== backdrop.key.toLowerCase() && 
                                          b.toLowerCase() !== backdrop.name.toLowerCase()
                                        )
                                      // Add using proper case name to match Notion format
                                      : [...(prev?.backdrops || []), backdrop.name];
                                    console.log('Backdrop click END:', { newBackdrops, newCount: newBackdrops.length });
                                    return { ...prev!, backdrops: newBackdrops };
                                  });
                                }}
                                disabled={isDisabled}
                                className={`p-3 text-sm rounded-lg border-2 transition ${
                                  isSelected
                                    ? 'border-[#0b3d2e] bg-[#0b3d2e]/10 font-medium'
                                    : isDisabled
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {backdrop.name}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                          {editedBooking?.backdrops?.length || 0} of {editedBooking?.duration && editedBooking.duration >= 60 ? '4' : '2'} backdrops selected
                          <span className="ml-2 text-xs">({editedBooking?.backdrops?.join(', ') || 'none'})</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Pricing */}
                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Session Price
                    </label>
                    <p className="mt-1 text-lg font-bold text-[#0b3d2e]">
                      ₱{(isEditing ? editedBooking?.sessionPrice : selectedBooking.sessionPrice)?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Add-ons
                    </label>
                    <p className="mt-1 text-lg font-bold text-blue-600">
                      ₱{(() => {
                        if (!isEditing) return selectedBooking.addonsTotal.toLocaleString();
                        const addonsTotal = (editedBooking?.addons || []).reduce((sum, id) => {
                          const prices: Record<string, number> = { '4r': 30, 'photostrip': 30, 'wallet': 30, 'premium4r': 50 };
                          return sum + (prices[id] || 0);
                        }, 0);
                        return addonsTotal.toLocaleString();
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Grand Total
                    </label>
                    <p className="mt-1 text-lg font-bold text-green-600">
                      ₱{(() => {
                        if (!isEditing) return selectedBooking.grandTotal.toLocaleString();
                        const addonsTotal = (editedBooking?.addons || []).reduce((sum, id) => {
                          const prices: Record<string, number> = { '4r': 30, 'photostrip': 30, 'wallet': 30, 'premium4r': 50 };
                          return sum + (prices[id] || 0);
                        }, 0);
                        return ((editedBooking?.sessionPrice || 0) + addonsTotal).toLocaleString();
                      })()}
                    </p>
                  </div>
                </div>
                {/* Status */}
                <div>
                  <label className="text-sm font-semibold text-neutral-700">Status</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={getStatusColor(selectedBooking.status)}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                {isEditing ? (
                  <>
                    <Button
                      className="flex-1 bg-[#0b3d2e] hover:bg-[#0a3426]"
                      onClick={saveBookingChanges}
                      disabled={updating}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updating ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedBooking(selectedBooking);
                      }}
                      disabled={updating}
                    >
                      Cancel
                    </Button>
                  </>
                ) : selectedBooking.status === "Confirmed" ? (
                  <>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => updateBookingStatus(selectedBooking.id, "Completed")}
                      disabled={updating}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {updating ? "Updating..." : "Mark as Completed"}
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => cancelBooking(selectedBooking.id)}
                      disabled={updating}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {updating ? "Cancelling..." : "Cancel Booking & Delete Event"}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
