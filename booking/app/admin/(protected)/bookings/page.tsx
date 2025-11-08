"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  X as CloseIcon
} from "lucide-react";

interface Booking {
  id: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("All");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>("All");
  const [serviceFilter, setServiceFilter] = useState<string>("All");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

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
      const response = await fetch(`/api/bookings/${bookingId}`, {
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
        alert("Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Error updating booking");
    } finally {
      setUpdating(false);
    }
  };

  const saveBookingChanges = async () => {
    if (!editedBooking) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/bookings/${editedBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedBooking),
      });

      if (response.ok) {
        await fetchBookings();
        setSelectedBooking(editedBooking);
        setIsEditing(false);
        alert("Booking updated successfully!");
      } else {
        alert("Failed to update booking");
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Error saving booking");
    } finally {
      setUpdating(false);
    }
  };

  // Filter bookings by time range
  const getFilteredByTimeRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      
      switch (timeRangeFilter) {
        case "today":
          return bookingDate.toDateString() === today.toDateString();
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return bookingDate >= weekAgo;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return bookingDate >= monthAgo;
        case "year":
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return bookingDate >= yearAgo;
        default:
          return true;
      }
    });
  };

  const filteredBookings = getFilteredByTimeRange()
    .filter((booking) => {
      const matchesSearch =
        booking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.phone.includes(searchQuery);
      
      const matchesStatus = statusFilter === "All" || booking.status === statusFilter;
      
      const matchesDate = !dateFilter || booking.date === dateFilter;
      
      const matchesServiceType = 
        serviceTypeFilter === "All" || booking.serviceType === serviceTypeFilter;
      
      const matchesServiceCategory =
        serviceCategoryFilter === "All" || booking.serviceCategory === serviceCategoryFilter;
      
      const matchesService = serviceFilter === "All" || booking.service === serviceFilter;

      return matchesSearch && matchesStatus && matchesDate && 
             matchesServiceType && matchesServiceCategory && matchesService;
    })
    .sort((a, b) => {
      // Sort by date (descending), then by time (descending)
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // Compare times if dates are the same
      return b.time.localeCompare(a.time);
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
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const timeRangeFilteredBookings = getFilteredByTimeRange();

  const stats = {
    total: timeRangeFilteredBookings.length,
    confirmed: timeRangeFilteredBookings.filter((b) => b.status === "Confirmed").length,
    pending: timeRangeFilteredBookings.filter((b) => b.status === "Pending").length,
    revenue: timeRangeFilteredBookings
      .filter((b) => b.status === "Confirmed" || b.status === "Completed")
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
        <Button className="bg-[#0b3d2e] hover:bg-[#0a3426] text-xs md:text-sm">
          <Download className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
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
            onClick={() => setTimeRangeFilter(range.value)}
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

      {/* Stats - Single Row with Icons */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Total Bookings</p>
              <p className="text-xl font-bold text-[#0b3d2e]">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Confirmed</p>
              <p className="text-xl font-bold text-green-600">{stats.confirmed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Total Revenue</p>
              <p className="text-xl font-bold text-[#0b3d2e]">
                ₱{stats.revenue.toLocaleString()}
              </p>
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
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-[#0b3d2e] hover:bg-[#0a3426]"
                    : ""
                }`}
              >
                {status}
              </Button>
            ))}
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
            />
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {uniqueServiceTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={serviceCategoryFilter}
              onChange={(e) => setServiceCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {uniqueServiceCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {uniqueServices.map((svc) => (
                <option key={svc} value={svc}>{svc}</option>
              ))}
            </select>
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
                setSelectedBooking(booking);
                setEditedBooking(booking);
                setIsEditing(false);
              }}
            >
              <div className="space-y-3">
                {/* Date & Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-[#0b3d2e]" />
                    <span className="font-semibold">{formatDate(booking.date)}</span>
                    <Clock className="w-4 h-4 text-neutral-500 ml-2" />
                    <span className="text-neutral-600">{booking.time}</span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>

                {/* Customer Info */}
                <div>
                  <p className="font-bold text-[#0b3d2e]">{booking.name}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {booking.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {booking.phone}
                    </span>
                  </div>
                </div>

                {/* Service Info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-neutral-600">Service Type:</span>
                    <p className="font-medium">{booking.serviceType}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Service:</span>
                    <p className="font-medium">{booking.service}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-neutral-600">Total</span>
                  <span className="text-lg font-bold text-[#0b3d2e]">
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
                  {!isEditing && selectedBooking.status === "Pending" && (
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
                    <label className="text-sm font-semibold text-neutral-700">Customer Name</label>
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
                    <label className="text-sm font-semibold text-neutral-700">Email</label>
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
                    <label className="text-sm font-semibold text-neutral-700">Phone</label>
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
                    <label className="text-sm font-semibold text-neutral-700">Address</label>
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
                  <h3 className="text-lg font-bold text-[#0b3d2e] mb-3">Service Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-neutral-700">Service Type</label>
                      <p className="mt-1">{selectedBooking.serviceType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-700">Category</label>
                      <p className="mt-1">{selectedBooking.serviceCategory}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-semibold text-neutral-700">Service Package</label>
                      <p className="mt-1">{selectedBooking.service}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-700">Date</label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedBooking?.date || ""}
                          onChange={(e) =>
                            setEditedBooking({ ...editedBooking!, date: e.target.value })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1">{formatDate(selectedBooking.date)}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-700">Time</label>
                      {isEditing ? (
                        <Input
                          type="time"
                          value={editedBooking?.time || ""}
                          onChange={(e) =>
                            setEditedBooking({ ...editedBooking!, time: e.target.value })
                          }
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1">{selectedBooking.time}</p>
                      )}
                    </div>
                  </div>
                </div>
                {/* Pricing */}
                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Session Price
                    </label>
                    <p className="mt-1 text-lg font-bold text-[#0b3d2e]">
                      ₱{selectedBooking.sessionPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Add-ons
                    </label>
                    <p className="mt-1 text-lg font-bold text-blue-600">
                      ₱{selectedBooking.addonsTotal.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Grand Total
                    </label>
                    <p className="mt-1 text-lg font-bold text-green-600">
                      ₱{selectedBooking.grandTotal.toLocaleString()}
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
                ) : selectedBooking.status === "Pending" ? (
                  <>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => updateBookingStatus(selectedBooking.id, "Confirmed")}
                      disabled={updating}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {updating ? "Confirming..." : "Confirm Booking"}
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => updateBookingStatus(selectedBooking.id, "Cancelled")}
                      disabled={updating}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {updating ? "Cancelling..." : "Cancel Booking"}
                    </Button>
                  </>
                ) : selectedBooking.status === "Confirmed" ? (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => updateBookingStatus(selectedBooking.id, "Completed")}
                    disabled={updating}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {updating ? "Updating..." : "Mark as Completed"}
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
