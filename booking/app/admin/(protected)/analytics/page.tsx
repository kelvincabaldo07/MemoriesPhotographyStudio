"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Package,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface AnalyticsData {
  stats: {
    totalRevenue: number;
    revenueChange: number;
    totalBookings: number;
    bookingsChange: number;
    avgBookingValue: number;
    valueChange: number;
    newCustomers: number;
    customersChange: number;
  };
  topServices: Array<{
    name: string;
    bookings: number;
    revenue: number;
    percentage: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  bookingsByDay: Array<{
    day: string;
    count: number;
  }>;
  recentActivity: Array<{
    customer: string;
    service: string;
    amount: number;
    date: string;
  }>;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#0b3d2e]">Analytics</h1>
        <Card className="p-8 text-center text-neutral-600">
          Loading analytics...
        </Card>
      </div>
    );
  }

  const { stats, topServices, revenueByMonth, bookingsByDay, recentActivity } = data;
  const maxRevenue = Math.max(...revenueByMonth.map((m) => m.revenue), 1);
  const maxBookings = Math.max(...bookingsByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-bold text-[#0b3d2e]">Analytics</h1>
          <p className="text-base-body text-neutral-600 mt-1">
            Revenue insights and booking trends
          </p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "year"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-h3 font-medium transition ${
                timeRange === range
                  ? "bg-[#0b3d2e] text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              {stats.revenueChange}%
            </Badge>
          </div>
          <p className="text-base-body text-neutral-600 mt-4">Total Revenue</p>
          <p className="text-h2 font-bold text-[#0b3d2e] mt-1">
            ₱{stats.totalRevenue.toLocaleString()}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              {stats.bookingsChange}%
            </Badge>
          </div>
          <p className="text-base-body text-neutral-600 mt-4">Total Bookings</p>
          <p className="text-h2 font-bold text-[#0b3d2e] mt-1">
            {stats.totalBookings}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              {stats.valueChange}%
            </Badge>
          </div>
          <p className="text-base-body text-neutral-600 mt-4">Avg Booking Value</p>
          <p className="text-h2 font-bold text-[#0b3d2e] mt-1">
            ₱{stats.avgBookingValue.toLocaleString()}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 border-orange-200"
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              {stats.customersChange}%
            </Badge>
          </div>
          <p className="text-base-body text-neutral-600 mt-4">New Customers</p>
          <p className="text-h2 font-bold text-[#0b3d2e] mt-1">
            {stats.newCustomers}
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="p-6">
          <h3 className="text-h2 font-bold text-[#0b3d2e] mb-4">
            Revenue Trend (Last 5 Months)
          </h3>
          <div className="space-y-3">
            {revenueByMonth.map((item) => (
              <div key={item.month}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-neutral-700">{item.month}</span>
                  <span className="font-semibold text-[#0b3d2e]">
                    ₱{item.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bookings by Day */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-[#0b3d2e] mb-4">
            Bookings by Day of Week
          </h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {bookingsByDay.map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                    style={{ height: `${(item.count / maxBookings) * 100}%` }}
                    title={`${item.count} bookings`}
                  />
                </div>
                <p className="text-xs font-medium text-neutral-600 mt-2">
                  {item.day}
                </p>
                <p className="text-xs text-neutral-500">{item.count}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-[#0b3d2e] mb-4">
            Top Services
          </h3>
          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div key={service.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#0b3d2e] text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium text-neutral-900">
                      {service.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    ₱{service.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#0b3d2e] to-[#0a3426] h-2 rounded-full"
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-600 w-16 text-right">
                    {service.bookings} bookings
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-[#0b3d2e] mb-4">
            Recent Bookings
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">
                    {activity.customer}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {activity.service}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    ₱{activity.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-500">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
