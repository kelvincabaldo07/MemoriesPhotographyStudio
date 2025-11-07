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

    // Group bookings by service
    const serviceMap = new Map();

    data.results.forEach((page: any) => {
      const props = page.properties;
      const serviceName = props.Service?.rich_text?.[0]?.plain_text || "";
      const serviceType = props["Service Type"]?.select?.name || "";
      const serviceCategory = props["Service Category"]?.select?.name || "";
      const grandTotal = props["Grand Total"]?.number || 0;
      const status = props.Status?.select?.name || "";

      if (serviceName) {
        const key = `${serviceName}|${serviceType}|${serviceCategory}`;
        
        if (!serviceMap.has(key)) {
          serviceMap.set(key, {
            name: serviceName,
            serviceType,
            serviceCategory,
            count: 0,
            totalRevenue: 0,
            prices: [],
          });
        }

        const service = serviceMap.get(key);
        service.count += 1;
        if (status === "Confirmed" || status === "Completed") {
          service.totalRevenue += grandTotal;
        }
        service.prices.push(grandTotal);
      }
    });

    // Calculate averages and format response
    const services = Array.from(serviceMap.values())
      .map((service) => ({
        name: service.name,
        serviceType: service.serviceType,
        serviceCategory: service.serviceCategory,
        count: service.count,
        totalRevenue: service.totalRevenue,
        avgPrice: service.prices.length > 0
          ? service.prices.reduce((sum: number, p: number) => sum + p, 0) / service.prices.length
          : 0,
      }))
      .sort((a, b) => b.count - a.count); // Sort by popularity

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
