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

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Notion");
    }

    const data = await response.json();

    // Group bookings by customer email
    const customerMap = new Map();

    data.results.forEach((page: any) => {
      const props = page.properties;
      const email = props.Email?.email || "";
      const name = props.Name?.title?.[0]?.plain_text || "";
      const phone = props.Phone?.phone_number || "";
      const grandTotal = props["Grand Total"]?.number || 0;
      const status = props.Status?.select?.name || "";
      const date = props.Date?.date?.start || "";
      const service = props.Service?.rich_text?.[0]?.plain_text || "";

      if (email) {
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            email,
            name,
            phone,
            bookings: [],
            totalBookings: 0,
            totalRevenue: 0,
            lastBooking: date,
          });
        }

        const customer = customerMap.get(email);
        customer.bookings.push({
          date,
          service,
          status,
          price: grandTotal,
        });
        customer.totalBookings += 1;
        if (status === "Confirmed" || status === "Completed") {
          customer.totalRevenue += grandTotal;
        }
        if (new Date(date) > new Date(customer.lastBooking)) {
          customer.lastBooking = date;
        }
      }
    });

    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
