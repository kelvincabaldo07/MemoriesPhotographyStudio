import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Default services configuration
const DEFAULT_SERVICES = [
  // Self-Shoot - Solo/Duo
  {
    name: "Solo/Duo 15",
    type: "Self-Shoot",
    group: "Solo/Duo",
    description: "1–2 pax\nUNLIMITED shots for 15 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 250,
    duration: 15,
    enabled: true,
  },
  {
    name: "Solo/Duo 30",
    type: "Self-Shoot",
    group: "Solo/Duo",
    description: "1–2 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 400,
    duration: 30,
    enabled: true,
  },
  {
    name: "Solo/Duo 60",
    type: "Self-Shoot",
    group: "Solo/Duo",
    description: "1–2 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 700,
    duration: 60,
    enabled: true,
  },
  // Self-Shoot - Small Group
  {
    name: "Small Group 15",
    type: "Self-Shoot",
    group: "Small Group",
    description: "3–5 pax\nUNLIMITED shots for 15 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 350,
    duration: 15,
    enabled: true,
  },
  {
    name: "Small Group 30",
    type: "Self-Shoot",
    group: "Small Group",
    description: "3–5 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 600,
    duration: 30,
    enabled: true,
  },
  {
    name: "Small Group 60",
    type: "Self-Shoot",
    group: "Small Group",
    description: "3–5 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 1000,
    duration: 60,
    enabled: true,
  },
  // Self-Shoot - Big Group
  {
    name: "Big Group 30",
    type: "Self-Shoot",
    group: "Big Group",
    description: "6–15 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 800,
    duration: 30,
    enabled: true,
  },
  {
    name: "Big Group 60",
    type: "Self-Shoot",
    group: "Big Group",
    description: "6–15 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 1500,
    duration: 60,
    enabled: true,
  },
  // With Photographer - Kids Pre-birthday (Girls)
  {
    name: "Dreamy Rainbow Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Bloom & Blush Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Rainbow Boho Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Pastel Daisies Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Butterfly Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Mermaid Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  // With Photographer - Kids Pre-birthday (Boys)
  {
    name: "Racing Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Safari Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Outer Space Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Hot Air Balloon Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Cuddly Bear Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Under the Sea Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Train Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Navy Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  // With Photographer - Adult/Family Shoot
  {
    name: "Adult's Pre-Birthday",
    type: "With Photographer",
    group: "Adult/Family Shoot",
    description: "45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Family/Group Portraits",
    type: "With Photographer",
    group: "Adult/Family Shoot",
    description: "3–8 pax\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Maternity Photoshoot",
    type: "With Photographer",
    group: "Adult/Family Shoot",
    description: "45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  // Seasonal Sessions - Christmas
  {
    name: "2025 Christmas – White & Gold (Solo/Duo)",
    type: "Seasonal Sessions",
    group: "Christmas",
    description: "1–2 pax\n45 minutes session in our airconditioned studio\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 10 days)\nCozy white & gold set",
    basePrice: 1000,
    duration: 45,
    specificDates: ["2025-11-21", "2025-11-28", "2025-12-05", "2025-12-06", "2025-12-13", "2026-11-21", "2026-11-28", "2026-12-05", "2026-12-06", "2026-12-13"],
    enabled: true,
  },
  {
    name: "2025 Christmas – White & Gold (Small Group)",
    type: "Seasonal Sessions",
    group: "Christmas",
    description: "3–5 pax\n45 minutes session in our airconditioned studio\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 10 days)\nCozy white & gold set",
    basePrice: 2000,
    duration: 45,
    specificDates: ["2025-11-21", "2025-11-28", "2025-12-05", "2025-12-06", "2025-12-13", "2026-11-21", "2026-11-28", "2026-12-05", "2026-12-06", "2026-12-13"],
    enabled: true,
  },
  {
    name: "2025 Christmas – White & Gold (Big Group)",
    type: "Seasonal Sessions",
    group: "Christmas",
    description: "6–8 pax\n45 minutes session in our airconditioned studio\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 10 days)\nCozy white & gold set",
    basePrice: 2500,
    duration: 45,
    specificDates: ["2025-11-21", "2025-11-28", "2025-12-05", "2025-12-06", "2025-12-13", "2026-11-21", "2026-11-28", "2026-12-05", "2026-12-06", "2026-12-13"],
    enabled: true,
  },
];

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  // Allow public access for reading service configs (needed for booking page)
  // Authentication is only required for POST/PUT/DELETE operations

  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_SERVICES_DATABASE_ID;

    // If no services database configured, return defaults
    if (!notionApiKey || !databaseId) {
      console.log("No services database configured, returning defaults");
      return NextResponse.json({ services: DEFAULT_SERVICES });
    }

    // Fetch from Notion services database
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
              property: "Type",
              direction: "ascending",
            },
          ],
        }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch from Notion, using defaults");
      return NextResponse.json({ services: DEFAULT_SERVICES });
    }

    const data = await response.json();

    // Transform Notion data to service config format
    const services = data.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id, // Store Notion page ID for updates
        name: props.Name?.title?.[0]?.plain_text || "",
        type: props.Type?.select?.name || "Self-Shoot",
        category: props.Category?.select?.name,
        group: props.Group?.rich_text?.[0]?.plain_text || "",
        description: props.Description?.rich_text?.[0]?.plain_text || "",
        basePrice: props.BasePrice?.number || 0,
        duration: props.Duration?.number || 45,
        availableFrom: props.AvailableFrom?.number,
        availableUntil: props.AvailableUntil?.number,
        specificDates: props.SpecificDates?.multi_select?.map((d: any) => d.name) || [],
        enabled: props.Enabled?.checkbox !== false,
        classicPrice: props.ClassicPrice?.number,
        thumbnail: props.Thumbnail?.url,
      };
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error reading services config:", error);
    // Return defaults on error
    return NextResponse.json({ services: DEFAULT_SERVICES });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, service } = await request.json();
    
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_SERVICES_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { error: "Services database not configured" },
        { status: 500 }
      );
    }

    console.log('Service action:', action, 'Service:', service);

    // Build Notion properties
    const notionProperties: any = {
      Name: {
        title: [{ text: { content: service.name || "" } }]
      },
      Type: {
        select: { name: service.type || "Self-Shoot" }
      },
      Group: {
        rich_text: [{ text: { content: service.group || "" } }]
      },
      Description: {
        rich_text: [{ text: { content: service.description || "" } }]
      },
      BasePrice: {
        number: service.basePrice || 0
      },
      Duration: {
        number: service.duration || 45
      },
      Enabled: {
        checkbox: service.enabled !== false
      }
    };

    // Optional properties
    if (service.category) {
      notionProperties.Category = {
        select: { name: service.category }
      };
    }

    if (service.availableFrom !== undefined) {
      notionProperties.AvailableFrom = {
        number: service.availableFrom
      };
    }

    if (service.availableUntil !== undefined) {
      notionProperties.AvailableUntil = {
        number: service.availableUntil
      };
    }

    if (service.classicPrice) {
      notionProperties.ClassicPrice = {
        number: service.classicPrice
      };
    }

    // Perform action
    if (action === "add") {
      // Create new page in Notion
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: notionProperties,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Notion create error:', errorData);
        throw new Error("Failed to create service in Notion");
      }

      return NextResponse.json({ success: true });
    } else if (action === "update" && service.id) {
      // Update existing page in Notion
      const response = await fetch(
        `https://api.notion.com/v1/pages/${service.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${notionApiKey}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: notionProperties,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Notion update error:', errorData);
        throw new Error("Failed to update service in Notion");
      }

      return NextResponse.json({ success: true });
    } else if (action === "delete" && service.id) {
      // Archive page in Notion
      const response = await fetch(
        `https://api.notion.com/v1/pages/${service.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${notionApiKey}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            archived: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Notion delete error:', errorData);
        throw new Error("Failed to delete service in Notion");
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid action or missing service ID" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating services config:", error);
    return NextResponse.json(
      { error: "Failed to update services configuration" },
      { status: 500 }
    );
  }
}
