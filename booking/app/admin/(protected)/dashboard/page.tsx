"use client";

import { Card } from "@/components/ui/card";
import { Calendar, Users, DollarSign, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  recentBookings: Booking[];
  upcomingBookings: Booking[];
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
    recentBookings: [],
    upcomingBookings: [],
  });
  const [loading, setLoading] = useState(true);
  // default to today as requested
  const [statsTimeFilter, setStatsTimeFilter] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

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
        const rangeMap = { day: 'week', week: 'week', month: 'month', year: 'year' };
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

  const { stats, recentBookings, upcomingBookings } = data;

  // Filter bookings by stats time period
  const filterBookingsByTime = (bookings: Booking[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
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

  const filteredRecentBookings = filterBookingsByTime(recentBookings);
  const filteredUpcomingBookings = filterBookingsByTime(upcomingBookings);
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

      {/* Time Filter Toggles */}
      <div className="flex gap-2">
        <Button
          variant={statsTimeFilter === 'day' ? "default" : "outline"}
          size="sm"
          onClick={() => setStatsTimeFilter('day')}
          className="text-h3"
        >
          Today
        </Button>
        <Button
          variant={statsTimeFilter === 'week' ? "default" : "outline"}
          size="sm"
          onClick={() => setStatsTimeFilter('week')}
          className="text-h3"
        >
          This Week
        </Button>
        <Button
          variant={statsTimeFilter === 'month' ? "default" : "outline"}
          size="sm"
          onClick={() => setStatsTimeFilter('month')}
          className="text-h3"
        >
          This Month
        </Button>
        <Button
          variant={statsTimeFilter === 'year' ? "default" : "outline"}
          size="sm"
          onClick={() => setStatsTimeFilter('year')}
          className="text-h3"
        >
          This Year
        </Button>
      </div>

      {/* Summary and Upcoming Bookings (upcoming moved beside summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-h2 font-semibold text-primary mb-3">Summary</h2>
          <Card className="p-6">
            <div className="grid grid-cols-4 gap-4 lg:gap-6">
              {/* Total Bookings */}
              <div className="text-center border-r last:border-r-0 border-border">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                    <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-base-body font-medium text-muted-foreground mb-1">Bookings</p>
                  <p className="text-h3 font-bold text-foreground">{filteredTotalBookings}</p>
                </div>
              </div>

              {/* Revenue */}
              <div className="text-center border-r last:border-r-0 border-border">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-base-body font-medium text-muted-foreground mb-1">Revenue</p>
                  <p className="text-h3 font-bold text-foreground">₱{filteredStats.monthlyRevenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Total Customers */}
              <div className="text-center border-r last:border-r-0 border-border">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-base-body font-medium text-muted-foreground mb-1">Customers</p>
                  <p className="text-h3 font-bold text-foreground">{filteredStats.totalCustomers}</p>
                </div>
              </div>

              {/* Avg Booking Value */}
              <div className="text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" />
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
