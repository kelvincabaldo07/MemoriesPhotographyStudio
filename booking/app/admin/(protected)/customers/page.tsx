"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, Calendar, DollarSign, User } from "lucide-react";

interface Customer {
  email: string;
  name: string;
  phone: string;
  bookings: Array<{
    date: string;
    service: string;
    status: string;
    price: number;
  }>;
  totalBookings: number;
  totalRevenue: number;
  lastBooking: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/admin/customers");
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

  const stats = {
    total: customers.length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalRevenue, 0),
    avgRevenue: customers.length > 0
      ? customers.reduce((sum, c) => sum + c.totalRevenue, 0) / customers.length
      : 0,
    totalBookings: customers.reduce((sum, c) => sum + c.totalBookings, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0b3d2e]">Customers</h1>
        <p className="text-neutral-600 mt-1">
          Manage customer information and booking history
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-neutral-600">Total Customers</p>
          <p className="text-2xl font-bold text-[#0b3d2e] mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ₱{stats.totalRevenue.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-600">Avg Revenue/Customer</p>
          <p className="text-2xl font-bold text-[#0b3d2e] mt-1">
            ₱{Math.round(stats.avgRevenue).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-600">Total Bookings</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.totalBookings}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Customers Grid */}
      {loading ? (
        <Card className="p-8 text-center text-neutral-600">
          Loading customers...
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card className="p-8 text-center text-neutral-600">
          No customers found
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.email}
              className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-[#0b3d2e] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 truncate">
                    {customer.name}
                  </h3>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-1 text-xs text-neutral-600">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-600">
                      <Phone className="w-3 h-3" />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-neutral-600 text-xs">Bookings</p>
                  <p className="font-semibold text-[#0b3d2e]">
                    {customer.totalBookings}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-600 text-xs">Revenue</p>
                  <p className="font-semibold text-green-600">
                    ₱{customer.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-neutral-600 text-xs">Last Booking</p>
                  <p className="font-medium text-neutral-900 text-xs">
                    {formatDate(customer.lastBooking)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCustomer(null)}
        >
          <Card
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#0b3d2e]">
                  Customer Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  ✕
                </Button>
              </div>

              {/* Customer Info */}
              <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-[#0b3d2e] rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-neutral-900">
                      {selectedCustomer.name}
                    </h3>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Mail className="w-4 h-4" />
                        {selectedCustomer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Phone className="w-4 h-4" />
                        {selectedCustomer.phone}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₱{selectedCustomer.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking History */}
              <div>
                <h3 className="text-lg font-bold text-[#0b3d2e] mb-4">
                  Booking History ({selectedCustomer.totalBookings})
                </h3>
                <div className="space-y-3">
                  {selectedCustomer.bookings
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((booking, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">
                            {booking.service}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-neutral-600">
                            <Calendar className="w-3 h-3" />
                            {formatDate(booking.date)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={getStatusColor(booking.status)}
                          >
                            {booking.status}
                          </Badge>
                          <p className="font-semibold text-[#0b3d2e] min-w-[80px] text-right">
                            ₱{booking.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
