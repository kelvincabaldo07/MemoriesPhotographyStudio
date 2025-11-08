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

    // Transform Notion data to a simpler format
    const bookings = data.results.map((page: any) => {
      const props = page.properties;
      const firstName = props["First Name"]?.rich_text?.[0]?.plain_text || "";
      const lastName = props["Last Name"]?.rich_text?.[0]?.plain_text || "";
      const fullName = `${firstName} ${lastName}`.trim() || props.Name?.title?.[0]?.plain_text || "";
      
      return {
        id: page.id,
        name: fullName,
        firstName,
        lastName,
        email: props.Email?.email || "",
        phone: props.Phone?.phone_number || "",
        address: props.Address?.rich_text?.[0]?.plain_text || "",
        serviceType: props["Service Type"]?.select?.name || "",
        serviceCategory: props["Service Category"]?.select?.name || "",
        serviceGroup: props["Service Group"]?.rich_text?.[0]?.plain_text || "",
        service: props.Service?.rich_text?.[0]?.plain_text || "",
        date: props.Date?.date?.start || "",
        time: props.Time?.rich_text?.[0]?.plain_text || "",
        duration: props.Duration?.number || 0,
        backdrops: props.Backdrops?.multi_select?.map((b: any) => b.name) || [],
        backdropAllocations: props["Backdrop Allocations"]?.rich_text?.[0]?.plain_text || "",
        backdropOrder: props["Backdrop Order"]?.rich_text?.[0]?.plain_text || "",
        addons: props["Add-ons"]?.multi_select?.map((a: any) => a.name) || [],
        socialConsent: props["Social Consent"]?.select?.name || "",
        eventType: props["Event Type"]?.select?.name || "",
        celebrantName: props["Celebrant Name"]?.rich_text?.[0]?.plain_text || "",
        birthdayAge: props["Birthday Age"]?.rich_text?.[0]?.plain_text || "",
        graduationLevel: props["Graduation Level"]?.rich_text?.[0]?.plain_text || "",
        eventDate: props["Event Date"]?.date?.start || "",
        sessionPrice: props["Session Price"]?.number || 0,
        addonsTotal: props["Add-ons Total"]?.number || 0,
        grandTotal: props["Grand Total"]?.number || 0,
        status: props.Status?.select?.name || "Pending",
        createdAt: page.created_time,
      };
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
