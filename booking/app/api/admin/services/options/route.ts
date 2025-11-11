import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/services/options
 * Returns dropdown options for services (types, categories, groups, services)
 * Used by admin edit forms
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_SERVICES_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { error: "Notion services database not configured" },
        { status: 500 }
      );
    }

    // Fetch all services from Notion
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
          filter: {
            property: "Enabled",
            checkbox: {
              equals: true
            }
          },
          sorts: [
            { property: "Type", direction: "ascending" },
            { property: "Group", direction: "ascending" },
            { property: "Name", direction: "ascending" },
          ],
        }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Notion");
    }

    const data = await response.json();

    // Extract unique values and build hierarchical structure
    const types = new Set<string>();
    const categories = new Set<string>();
    const groupsByType: Record<string, Set<string>> = {};
    const servicesByGroup: Record<string, Array<{ name: string; duration: number; price: number; category: string }>> = {};

    data.results.forEach((page: any) => {
      const props = page.properties;
      const type = props.Type?.select?.name || "";
      const category = props.Category?.select?.name || "";
      const group = props.Group?.rich_text?.[0]?.plain_text || "";
      const name = props.Name?.title?.[0]?.plain_text || "";
      const duration = props.Duration?.number || 45;
      const basePrice = props.BasePrice?.number || 0;

      if (type) {
        types.add(type);
        
        if (!groupsByType[type]) {
          groupsByType[type] = new Set();
        }
        if (group) {
          groupsByType[type].add(group);
        }
      }

      if (category) {
        categories.add(category);
      }

      if (group) {
        if (!servicesByGroup[group]) {
          servicesByGroup[group] = [];
        }
        servicesByGroup[group].push({ name, duration, price: basePrice, category });
      }
    });

    // Convert Sets to Arrays for JSON serialization
    const result = {
      types: Array.from(types),
      categories: Array.from(categories),
      groupsByType: Object.fromEntries(
        Object.entries(groupsByType).map(([key, value]) => [key, Array.from(value)])
      ),
      servicesByGroup,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching service options:", error);
    return NextResponse.json(
      { error: "Failed to fetch service options" },
      { status: 500 }
    );
  }
}
