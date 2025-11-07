import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_BOOKINGS_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { error: "Notion API credentials not configured" },
        { status: 500 }
      );
    }

    // Fetch all bookings
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
          sorts: [
            {
              property: "Date",
              direction: "descending",
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Notion");
    }

    const data = await response.json();
    const bookings = data.results;

    // Calculate stats
    const totalBookings = bookings.length;
    
    // Calculate monthly revenue (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let monthlyRevenue = 0;
    let monthlyBookingsCount = 0;
    let lastMonthRevenue = 0;
    let lastMonthBookingsCount = 0;
    
    // Get unique customers
    const uniqueEmails = new Set();
    let newCustomersThisMonth = 0;
    
    bookings.forEach((page: any) => {
      const props = page.properties;
      const grandTotal = props["Grand Total"]?.number || 0;
      const email = props.Email?.email || "";
      const bookingDate = new Date(props.Date?.date?.start || "");
      
      // Add to unique customers
      if (email) {
        uniqueEmails.add(email);
      }
      
      // Check if booking is in current month
      if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
        monthlyRevenue += grandTotal;
        monthlyBookingsCount++;
        
        // Check if customer is new this month
        const createdDate = new Date(page.created_time);
        if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
          newCustomersThisMonth++;
        }
      }
      
      // Check if booking was last month
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      if (bookingDate.getMonth() === lastMonth && bookingDate.getFullYear() === lastMonthYear) {
        lastMonthRevenue += grandTotal;
        lastMonthBookingsCount++;
      }
    });
    
    const totalCustomers = uniqueEmails.size;
    
    // Calculate percentage changes
    const revenueChange = lastMonthRevenue > 0 
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;
      
    const bookingsChange = lastMonthBookingsCount > 0
      ? Math.round(((monthlyBookingsCount - lastMonthBookingsCount) / lastMonthBookingsCount) * 100)
      : 0;
    
    // Split bookings into recent (past) and upcoming (future)
    const nowTimestamp = Date.now();
    const pastBookings: any[] = [];
    const futureBookings: any[] = [];
    
    bookings.forEach((page: any) => {
      const props = page.properties;
      const bookingDate = new Date(props.Date?.date?.start || "");
      const booking = {
        id: page.id,
        name: props["Client Name"]?.title?.[0]?.plain_text || "",
        service: props.Service?.rich_text?.[0]?.plain_text || "",
        serviceType: props["Service Type"]?.select?.name || "",
        date: props.Date?.date?.start || "",
        status: props.Status?.select?.name || "Pending",
      };
      
      if (bookingDate.getTime() < nowTimestamp) {
        pastBookings.push(booking);
      } else {
        futureBookings.push(booking);
      }
    });
    
    // Recent bookings: past bookings, most recent first (already sorted descending)
    const recentBookings = pastBookings.slice(0, 10);
    
    // Upcoming bookings: future bookings, earliest first (reverse sort)
    const upcomingBookings = futureBookings.reverse().slice(0, 10);

    return NextResponse.json({
      stats: {
        totalBookings,
        monthlyRevenue,
        totalCustomers,
        newCustomersThisMonth,
        revenueChange,
        bookingsChange,
      },
      recentBookings,
      upcomingBookings,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
