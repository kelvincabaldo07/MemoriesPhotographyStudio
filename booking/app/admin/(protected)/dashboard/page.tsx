"use client";

import { Card } from "@/components/ui/card";
import { Calendar, Users, DollarSign, TrendingUp, CheckCircle, XCircle, Clock, RefreshCw, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { RevenueLineChart } from "@/components/ui/revenue-line-chart";

interface Booking {
  id: string;
  name: string;
  service: string;
  serviceType: string;
  date: string;
  status: string;
}

interface DashboardData {
  stats: {
    totalBookings: number;
    monthlyRevenue: number;
    totalCustomers: number;
    newCustomersThisMonth: number;
    revenueChange: number;
    bookingsChange: number;
  };
  breakdown: {
    created: number;
    completed: number;
    rescheduled: number;
    cancelled: number;
  };
  recentBookings: Booking[];
  upcomingBookings: Booking[];
  topCustomers: Array<{
    rank: number;
    name: string;
    email: string;
    revenue: number;
    bookings: number;
  }>;
}

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
    fullDate?: string;
  }>;
  bookingsByDay: Array<{
    day: string;
    count: number;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalBookings: 0,
      monthlyRevenue: 0,
      totalCustomers: 0,
      newCustomersThisMonth: 0,
      revenueChange: 0,
      bookingsChange: 0,
    },
    breakdown: {
      created: 0,
      completed: 0,
      rescheduled: 0,
      cancelled: 0,
    },
    recentBookings: [],
    upcomingBookings: [],
    topCustomers: [],
  });
  const [loading, setLoading] = useState(true);
  // default to today as requested
  const [statsTimeFilter, setStatsTimeFilter] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('day');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const dashboardData: DashboardData = await response.json();
        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const rangeMap: Record<string, string> = { day: 'week', week: 'week', month: 'month', year: 'year', all: 'year' };
        const range = rangeMap[statsTimeFilter];
        const response = await fetch(`/api/admin/analytics?range=${range}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const analyticsResult: AnalyticsData = await response.json();
        setAnalyticsData(analyticsResult);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    }
    
    fetchAnalytics();
  }, [statsTimeFilter]);

  const { stats, breakdown, recentBookings, upcomingBookings, topCustomers } = data;

  // Filter bookings by stats time period
  const filterBookingsByTime = (bookings: Booking[], isUpcoming: boolean = false) => {
    if (statsTimeFilter === 'all') {
      return bookings;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      
      // For upcoming bookings, always show all future bookings regardless of filter
      if (isUpcoming) {
        return bookingDate >= today;
      }
      
      // For past bookings, filter by past time ranges
      switch (statsTimeFilter) {
        case 'day':
          return bookingDate.toDateString() === today.toDateString();
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return bookingDate >= weekAgo && bookingDate <= now;
        case 'month':
          return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
        case 'year':
          return bookingDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  const filteredRecentBookings = filterBookingsByTime(recentBookings, false);
  const filteredUpcomingBookings = filterBookingsByTime(upcomingBookings, true);
  const filteredTotalBookings = filteredRecentBookings.length + filteredUpcomingBookings.length;

  // Calculate filtered stats
  const calculateFilteredStats = () => {
    // For now, we'll use the existing stats from API
    // In a real scenario, you'd filter by date on the backend
    return stats;
  };

  const filteredStats = calculateFilteredStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's an overview of your studio.
        </p>
      </div>

      {/* Period Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-h3 font-bold text-[#0b3d2e]">Period</h3>
          <div className="relative">
            <select
              value={statsTimeFilter}
              onChange={(e) => {
                const value = e.target.value as 'day' | 'week' | 'month' | 'year' | 'all';
                setStatsTimeFilter(value);
                const today = new Date();
                
                if (value === 'day') {
                  const todayStr = today.toISOString().split('T')[0];
                  setStartDate(todayStr);
                  setEndDate(todayStr);
                } else if (value === 'week') {
                  const dayOfWeek = today.getDay();
                  const monday = new Date(today);
                  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                  const sunday = new Date(monday);
                  sunday.setDate(monday.getDate() + 6);
                  setStartDate(monday.toISOString().split('T')[0]);
                  setEndDate(sunday.toISOString().split('T')[0]);
                } else if (value === 'month') {
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  setStartDate(firstDay.toISOString().split('T')[0]);
                  setEndDate(lastDay.toISOString().split('T')[0]);
                } else if (value === 'year') {
                  const firstDay = new Date(today.getFullYear(), 0, 1);
                  const lastDay = new Date(today.getFullYear(), 11, 31);
                  setStartDate(firstDay.toISOString().split('T')[0]);
                  setEndDate(lastDay.toISOString().split('T')[0]);
                } else if (value === 'all') {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className="appearance-none w-auto min-w-[140px] h-10 pl-3 pr-10 rounded-md border-none bg-[#0b3d2e] text-white text-base-body font-semibold cursor-pointer"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-base-body font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-base-body"
            />
          </div>
          <div>
            <label className="text-base-body font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-base-body"
            />
          </div>
        </div>
      </Card>

      {/* Summary and Upcoming Bookings (upcoming moved beside summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-h2 font-semibold text-primary mb-3">Summary</h2>
          <Card className="p-6">
            <div className="grid grid-cols-4 gap-4 lg:gap-6">
              {/* Total Bookings */}
              <div className="text-center border-r last:border-r-0 border-border">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#A62F20] rounded-lg flex items-center justify-center mb-2">
                    <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <p className="text-base-body font-medium text-muted-foreground mb-1">Bookings</p>
                  <p className="text-h3 font-bold text-foreground">{filteredTotalBookings}</p>
                </div>
              </div>

              {/* Revenue */}
              <div className="text-center border-r last:border-r-0 border-border">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#0b3d2e] rounded-lg flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <p className="text-base-body font-medium text-muted-foreground mb-1">Revenue</p>
                  <p className="text-h3 font-bold text-foreground">₱{filteredStats.monthlyRevenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Total Customers */}
              <div className="text-center border-r last:border-r-0 border-border">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#8B5E3C] rounded-lg flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <p className="text-base-body font-medium text-muted-foreground mb-1">Customers</p>
                  <p className="text-h3 font-bold text-foreground">{filteredStats.totalCustomers}</p>
                </div>
              </div>

              {/* Avg Booking Value */}
              <div className="text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#FAF3E0] rounded-lg flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-[#2C2C2C]" />
                  </div>
                  <p className="text-base-body font-medium text-muted-foreground mb-1">Avg. Value</p>
                  <p className="text-h3 font-bold text-foreground">₱{filteredTotalBookings > 0 ? Math.round((filteredStats.monthlyRevenue / filteredTotalBookings)).toLocaleString() : 0}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-h2 font-semibold text-primary mb-3">Upcoming Bookings</h2>
          <Card className="p-6">
            <div className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground text-center py-4">Loading...</p>
              ) : (
                (() => {
                  let filteredBookings = filteredUpcomingBookings;

                  if (filteredBookings.length === 0) {
                    return <p className="text-muted-foreground text-center py-4">No bookings</p>;
                  }

                  return filteredBookings.map((booking) => {
                    const getStatusColor = (status: string) => {
                      switch (status.toLowerCase()) {
                        case "confirmed":
                          return "bg-green-100 text-green-700";
                        case "pending":
                          return "bg-blue-100 text-blue-700";
                        case "completed":
                          return "bg-gray-100 text-gray-700";
                        case "cancelled":
                          return "bg-red-100 text-red-700";
                        default:
                          return "bg-neutral-100 text-neutral-700";
                      }
                    };

                    const formatDate = (dateString: string) => {
                      const date = new Date(dateString);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    };

                    return (
                      <div key={booking.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-h3 font-semibold truncate">{booking.name}</p>
                          <p className="text-base-body text-neutral-600 truncate">{booking.service || booking.serviceType}</p>
                          <p className="text-base-body text-neutral-500">{formatDate(booking.date)}</p>
                        </div>
                        <Badge variant="outline" className={`${getStatusColor(booking.status)} ml-2 flex-shrink-0`}>{booking.status}</Badge>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Bookings Breakdown */}
      <div>
        <h2 className="text-h2 font-semibold text-primary mb-3">Bookings Breakdown</h2>
        <Card className="p-6">
          <div className="grid grid-cols-4 gap-4 lg:gap-6">
            {/* Bookings Created */}
            <div className="text-center border-r last:border-r-0 border-border">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#8B5E3C] rounded-lg flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-base-body font-medium text-muted-foreground mb-1">Created</p>
                <p className="text-h3 font-bold text-foreground">{breakdown.created}</p>
              </div>
            </div>

            {/* Bookings Completed */}
            <div className="text-center border-r last:border-r-0 border-border">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#0b3d2e] rounded-lg flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-base-body font-medium text-muted-foreground mb-1">Completed</p>
                <p className="text-h3 font-bold text-foreground">{breakdown.completed}</p>
              </div>
            </div>

            {/* Bookings Rescheduled */}
            <div className="text-center border-r last:border-r-0 border-border">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#FAF3E0] rounded-lg flex items-center justify-center mb-2">
                  <RefreshCw className="w-5 h-5 lg:w-6 lg:h-6 text-[#2C2C2C]" />
                </div>
                <p className="text-base-body font-medium text-muted-foreground mb-1">Rescheduled</p>
                <p className="text-h3 font-bold text-foreground">{breakdown.rescheduled}</p>
              </div>
            </div>

            {/* Bookings Cancelled/No Show */}
            <div className="text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#A62F20] rounded-lg flex items-center justify-center mb-2">
                  <XCircle className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-base-body font-medium text-muted-foreground mb-1">Cancelled/No Show</p>
                <p className="text-h3 font-bold text-foreground">{breakdown.cancelled}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Charts */}
      {analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend - show last 12 months as a line chart */}
          <div>
            <h2 className="text-h2 font-semibold text-primary mb-3">Revenue Trend (Last 12 Months)</h2>
            <Card className="p-6">
              <RevenueLineChart 
                data={analyticsData.revenueByMonth} 
                height={280}
                strokeColor="#10b981"
                fillColor="#10b981"
              />
            </Card>
          </div>

          {/* Top Services */}
          <div>
            <h2 className="text-h2 font-semibold text-primary mb-3">
              Top Services
            </h2>
            <Card className="p-6">
            <div className="space-y-4">
              {analyticsData.topServices.map((service, index) => (
                <div key={service.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-base-body font-bold">
                        {index + 1}
                      </span>
                      <span className="text-h3 font-medium text-foreground">
                        {service.name}
                      </span>
                    </div>
                    <span className="text-h3 font-semibold text-green-600 dark:text-green-400">
                      ₱{service.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full"
                        style={{ width: `${service.percentage}%` }}
                      />
                    </div>
                    <span className="text-base-body text-muted-foreground w-16 text-right">
                      {service.bookings} bookings
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Top Customers */}
        <div>
          <h2 className="text-h2 font-semibold text-primary mb-3">
            Top Customers
          </h2>
          <Card className="p-6">
            <div className="space-y-4">
              {topCustomers.map((customer) => (
                <div key={customer.email}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-[#8B5E3C] text-white rounded-full flex items-center justify-center text-base-body font-bold">
                        {customer.rank}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-h3 font-medium text-foreground">
                          {customer.name}
                        </span>
                        <span className="text-base-body text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      </div>
                    </div>
                    <span className="text-h3 font-semibold text-green-600 dark:text-green-400">
                      ₱{customer.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#8B5E3C] to-[#8B5E3C]/80 h-2 rounded-full"
                        style={{ width: `${Math.min((customer.revenue / topCustomers[0].revenue) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-base-body text-muted-foreground w-16 text-right">
                      {customer.bookings} bookings
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-h2 font-semibold text-primary mb-3">Quick Actions</h2>
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border-2 border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors group">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary group-hover:text-primary-foreground" />
              <p className="text-h3 font-medium">New Booking</p>
            </button>
            <button className="p-4 border-2 border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors group">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary group-hover:text-primary-foreground" />
              <p className="text-h3 font-medium">Add Customer</p>
            </button>
            <button className="p-4 border-2 border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors group">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary group-hover:text-primary-foreground" />
              <p className="text-h3 font-medium">View Analytics</p>
            </button>
            <button className="p-4 border-2 border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors group">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary group-hover:text-primary-foreground" />
              <p className="text-h3 font-medium">Revenue Report</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
