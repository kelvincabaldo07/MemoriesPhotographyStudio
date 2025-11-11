import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper function to check if status counts as confirmed (for revenue)
function isConfirmedStatus(status: string): boolean {
  const confirmedStatuses = [
    "Booking Confirmed",
    "Attendance Confirmed", 
    "Session Completed",
    "RAW Photos Sent",
    "Final Deliverables Sent",
    "Access Granted - Completed"
  ];
  return confirmedStatuses.includes(status);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "month";

    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_BOOKINGS_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { error: "Notion API credentials not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sorts: [{ property: "Date", direction: "descending" }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Notion");
    }

    const data = await response.json();
    const bookings = data.results;

    // Calculate date ranges
    const now = new Date();
    const getStartDate = (range: string) => {
      const date = new Date();
      if (range === "week") date.setDate(date.getDate() - 7);
      else if (range === "month") date.setMonth(date.getMonth() - 1);
      else if (range === "year") date.setFullYear(date.getFullYear() - 1);
      return date;
    };

    const startDate = getStartDate(range);
    const previousStartDate = new Date(startDate);
    if (range === "week") previousStartDate.setDate(previousStartDate.getDate() - 7);
    else if (range === "month") previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    else if (range === "year") previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);

    // Filter bookings by period
    let currentPeriodRevenue = 0;
    let currentPeriodBookings = 0;
    let previousPeriodRevenue = 0;
    let previousPeriodBookings = 0;
    const uniqueCustomers = new Set();
    const previousCustomers = new Set();
    
    // For charts
    const serviceMap = new Map();
    const monthlyRevenue = new Map();
    const dayOfWeekCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const recentBookings: any[] = [];

    bookings.forEach((page: any) => {
      const props = page.properties;
      const bookingDate = new Date(props.Date?.date?.start || "");
      const grandTotal = props["Grand Total"]?.number || 0;
      const email = props.Email?.email || "";
      const status = props.Status?.select?.name || "";
      const serviceName = props.Service?.rich_text?.[0]?.plain_text || "";
      const name = props.Name?.title?.[0]?.plain_text || "";

      // Current period stats
      if (bookingDate >= startDate) {
        currentPeriodBookings++;
        if (isConfirmedStatus(status)) {
          currentPeriodRevenue += grandTotal;
        }
        if (email) uniqueCustomers.add(email);

        // Track service popularity
        if (serviceName && isConfirmedStatus(status)) {
          if (!serviceMap.has(serviceName)) {
            serviceMap.set(serviceName, { name: serviceName, bookings: 0, revenue: 0 });
          }
          const service = serviceMap.get(serviceName);
          service.bookings++;
          service.revenue += grandTotal;
        }

        // Day of week distribution
        const dayName = bookingDate.toLocaleDateString("en-US", { weekday: "short" });
        if (dayName in dayOfWeekCounts) {
          dayOfWeekCounts[dayName as keyof typeof dayOfWeekCounts]++;
        }

        // Recent activity (last 10)
        if (recentBookings.length < 10) {
          const timeDiff = now.getTime() - bookingDate.getTime();
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
          const daysAgo = Math.floor(hoursAgo / 24);
          
          let timeStr;
          if (hoursAgo < 1) timeStr = "Just now";
          else if (hoursAgo < 24) timeStr = `${hoursAgo} hours ago`;
          else if (daysAgo === 1) timeStr = "1 day ago";
          else timeStr = `${daysAgo} days ago`;

          recentBookings.push({
            customer: name,
            service: serviceName,
            amount: grandTotal,
            date: timeStr,
          });
        }
      }

      // Previous period stats
      if (bookingDate >= previousStartDate && bookingDate < startDate) {
        previousPeriodBookings++;
        if (isConfirmedStatus(status)) {
          previousPeriodRevenue += grandTotal;
        }
        if (email) previousCustomers.add(email);
      }

      // Monthly revenue (last 12 months for chart)
      if (bookingDate >= new Date(now.getFullYear(), now.getMonth() - 11, 1)) {
        const monthKey = bookingDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        if (isConfirmedStatus(status)) {
          monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + grandTotal);
        }
      }
    });

    // Calculate changes
    const revenueChange = previousPeriodRevenue > 0
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : 0;

    const bookingsChange = previousPeriodBookings > 0
      ? ((currentPeriodBookings - previousPeriodBookings) / previousPeriodBookings) * 100
      : 0;

    const avgBookingValue = currentPeriodBookings > 0
      ? currentPeriodRevenue / currentPeriodBookings
      : 0;

    const previousAvgValue = previousPeriodBookings > 0
      ? previousPeriodRevenue / previousPeriodBookings
      : 0;

    const valueChange = previousAvgValue > 0
      ? ((avgBookingValue - previousAvgValue) / previousAvgValue) * 100
      : 0;

    const newCustomers = uniqueCustomers.size;
    const previousCustomerCount = previousCustomers.size;
    const customersChange = previousCustomerCount > 0
      ? ((newCustomers - previousCustomerCount) / previousCustomerCount) * 100
      : 0;

    // Top services
    const topServices = Array.from(serviceMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((service) => ({
        name: service.name,
        bookings: service.bookings,
        revenue: service.revenue,
        percentage: currentPeriodRevenue > 0
          ? Math.round((service.revenue / currentPeriodRevenue) * 100)
          : 0,
      }));

    // Revenue by month - Build complete 12-month dataset
    const last12Months: Array<{ month: string; revenue: number; fullDate: string }> = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const shortMonth = date.toLocaleDateString("en-US", { month: "short" });
      last12Months.push({
        month: shortMonth,
        revenue: monthlyRevenue.get(monthKey) || 0,
        fullDate: monthKey,
      });
    }
    
    const revenueByMonth = last12Months;

    // Bookings by day
    const bookingsByDay = Object.entries(dayOfWeekCounts).map(([day, count]) => ({
      day,
      count,
    }));

    return NextResponse.json({
      stats: {
        totalRevenue: Math.round(currentPeriodRevenue),
        revenueChange: Math.round(revenueChange * 10) / 10,
        totalBookings: currentPeriodBookings,
        bookingsChange: Math.round(bookingsChange * 10) / 10,
        avgBookingValue: Math.round(avgBookingValue),
        valueChange: Math.round(valueChange * 10) / 10,
        newCustomers,
        customersChange: Math.round(customersChange * 10) / 10,
      },
      topServices,
      revenueByMonth,
      bookingsByDay,
      recentActivity: recentBookings,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
