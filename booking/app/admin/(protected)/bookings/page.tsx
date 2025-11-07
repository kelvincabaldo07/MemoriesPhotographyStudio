"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Calendar, Clock, Mail, Phone } from "lucide-react";

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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.phone.includes(searchQuery);
    
    const matchesStatus =
      statusFilter === "All" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
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

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "Confirmed").length,
    pending: bookings.filter((b) => b.status === "Pending").length,
    revenue: bookings
      .filter((b) => b.status === "Confirmed" || b.status === "Completed")
      .reduce((sum, b) => sum + b.grandTotal, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0b3d2e]">Bookings</h1>
          <p className="text-neutral-600 mt-1">
            Manage all studio bookings and reservations
          </p>
        </div>
        <Button className="bg-[#0b3d2e] hover:bg-[#0a3426]">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-neutral-600">Total Bookings</p>
          <p className="text-2xl font-bold text-[#0b3d2e] mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-600">Confirmed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-600">Total Revenue</p>
          <p className="text-2xl font-bold text-[#0b3d2e] mt-1">
            ₱{stats.revenue.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={
                  statusFilter === status
                    ? "bg-[#0b3d2e] hover:bg-[#0a3426]"
                    : ""
                }
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-600">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-neutral-600">No bookings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-700">
                    Customer
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-700">
                    Service
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-700">
                    Date & Time
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-700">
                    Duration
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-700">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-700">
                    Price
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-neutral-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-neutral-900">{booking.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-600">
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
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-neutral-900">{booking.service}</p>
                      <p className="text-xs text-neutral-600 mt-1">
                        {booking.serviceType} • {booking.serviceCategory}
                      </p>
                      {booking.backdrops.length > 0 && (
                        <p className="text-xs text-neutral-600 mt-1">
                          Backdrops: {booking.backdrops.join(", ")}
                        </p>
                      )}
                      {booking.addons.length > 0 && (
                        <p className="text-xs text-neutral-600 mt-1">
                          Add-ons: {booking.addons.join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        {formatDate(booking.date)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-neutral-600 mt-1">
                        <Clock className="w-4 h-4 text-neutral-500" />
                        {booking.time}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-neutral-700">
                      {booking.duration} min
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={getStatusColor(booking.status)}
                      >
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-semibold text-[#0b3d2e]">
                      ₱{booking.grandTotal.toLocaleString()}
                      {booking.sessionPrice !== booking.grandTotal && (
                        <p className="text-xs text-neutral-600 font-normal mt-1">
                          Session: ₱{booking.sessionPrice.toLocaleString()}
                          {booking.addonsTotal > 0 && ` + ₱${booking.addonsTotal}`}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <Card
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#0b3d2e]">
                  Booking Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-neutral-700">
                    Customer Name
                  </label>
                  <p className="mt-1">{selectedBooking.name}</p>
                  {selectedBooking.firstName && selectedBooking.lastName && (
                    <p className="text-sm text-neutral-600">
                      ({selectedBooking.firstName} {selectedBooking.lastName})
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Email
                    </label>
                    <p className="mt-1">{selectedBooking.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Phone
                    </label>
                    <p className="mt-1">{selectedBooking.phone}</p>
                  </div>
                </div>
                {selectedBooking.address && (
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Address
                    </label>
                    <p className="mt-1">{selectedBooking.address}</p>
                  </div>
                )}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold text-[#0b3d2e] mb-3">Service Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-neutral-700">
                        Service Type
                      </label>
                      <p className="mt-1">{selectedBooking.serviceType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-700">
                        Category
                      </label>
                      <p className="mt-1">{selectedBooking.serviceCategory}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-sm font-semibold text-neutral-700">
                      Service Package
                    </label>
                    <p className="mt-1">{selectedBooking.service}</p>
                    {selectedBooking.serviceGroup && (
                      <p className="text-sm text-neutral-600">Group: {selectedBooking.serviceGroup}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Date
                    </label>
                    <p className="mt-1">{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Time
                    </label>
                    <p className="mt-1">{selectedBooking.time}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-neutral-700">
                    Duration
                  </label>
                  <p className="mt-1">{selectedBooking.duration} minutes</p>
                </div>
                {selectedBooking.backdrops.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Backdrops
                    </label>
                    <p className="mt-1">{selectedBooking.backdrops.join(", ")}</p>
                    {selectedBooking.backdropOrder && (
                      <p className="text-sm text-neutral-600">Order: {selectedBooking.backdropOrder}</p>
                    )}
                    {selectedBooking.backdropAllocations && (
                      <p className="text-sm text-neutral-600">Allocations: {selectedBooking.backdropAllocations}</p>
                    )}
                  </div>
                )}
                {selectedBooking.addons.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Add-ons
                    </label>
                    <p className="mt-1">{selectedBooking.addons.join(", ")}</p>
                  </div>
                )}
                {(selectedBooking.eventType || selectedBooking.socialConsent) && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-bold text-[#0b3d2e] mb-3">Event Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedBooking.socialConsent && (
                        <div>
                          <label className="text-sm font-semibold text-neutral-700">
                            OK to Post
                          </label>
                          <div className="mt-1">
                            <Badge variant="outline" className={
                              selectedBooking.socialConsent === "yes" 
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }>
                              {selectedBooking.socialConsent === "yes" ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {selectedBooking.eventType && (
                        <div>
                          <label className="text-sm font-semibold text-neutral-700">
                            Event Type
                          </label>
                          <p className="mt-1">{selectedBooking.eventType}</p>
                        </div>
                      )}
                    </div>
                    {selectedBooking.celebrantName && (
                      <div className="mt-3">
                        <label className="text-sm font-semibold text-neutral-700">
                          Celebrant Name
                        </label>
                        <p className="mt-1">{selectedBooking.celebrantName}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      {selectedBooking.birthdayAge && (
                        <div>
                          <label className="text-sm font-semibold text-neutral-700">
                            Age
                          </label>
                          <p className="mt-1">{selectedBooking.birthdayAge}</p>
                        </div>
                      )}
                      {selectedBooking.graduationLevel && (
                        <div>
                          <label className="text-sm font-semibold text-neutral-700">
                            Graduation Level
                          </label>
                          <p className="mt-1">{selectedBooking.graduationLevel}</p>
                        </div>
                      )}
                    </div>
                    {selectedBooking.eventDate && (
                      <div className="mt-3">
                        <label className="text-sm font-semibold text-neutral-700">
                          Event Date
                        </label>
                        <p className="mt-1">{formatDate(selectedBooking.eventDate)}</p>
                      </div>
                    )}
                  </div>
                )}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={getStatusColor(selectedBooking.status)}
                      >
                        {selectedBooking.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-neutral-700">
                      Booked On
                    </label>
                    <p className="mt-1 text-sm">
                      {new Date(selectedBooking.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  Confirm Booking
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700">
                  Cancel Booking
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
