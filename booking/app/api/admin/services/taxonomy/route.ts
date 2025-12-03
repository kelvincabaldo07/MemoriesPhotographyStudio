/**
 * Dynamic Taxonomy API
 * Builds the service taxonomy dynamically from Notion services database
 */

import { NextResponse } from "next/server";

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_SERVICES_DATABASE_ID;

    // Default taxonomy if Notion not configured
    const defaultTaxonomy = {
      types: ["Self-Shoot", "With Photographer", "Seasonal Sessions"],
      categories: ["Classic", "Digital"],
      groups: {
        "Self-Shoot": ["Solo/Duo", "Small Group", "Big Group"],
        "With Photographer": [
          "Kids Pre-birthday (Girls)",
          "Kids Pre-birthday (Boys)",
          "Adult/Family Shoot",
        ],
        "Seasonal Sessions": ["Christmas"],
      },
      services: {
        "Self-Shoot": {
          "Solo/Duo": ["Solo/Duo 15", "Solo/Duo 30", "Solo/Duo 60"],
          "Small Group": ["Small Group 15", "Small Group 30", "Small Group 60"],
          "Big Group": ["Big Group 30", "Big Group 60"],
        },
        "With Photographer": {
          "Kids Pre-birthday (Girls)": [
            "Dreamy Rainbow Theme",
            "Bloom & Blush Theme",
            "Rainbow Boho Theme",
            "Pastel Daisies Theme",
            "Butterfly Theme",
            "Mermaid Theme",
            "Pink Cloud Wonderland Theme",
          ],
          "Kids Pre-birthday (Boys)": [
            "Racing Theme",
            "Safari Theme",
            "Outer Space Theme",
            "Hot Air Balloon Theme",
            "Cuddly Bear Theme",
            "Under the Sea Theme",
            "Train Theme",
            "Navy Theme",
          ],
          "Adult/Family Shoot": ["Adult's Pre-Birthday", "Maternity Photoshoot", "Family/Group Portraits"],
        },
        "Seasonal Sessions": {
          Christmas: [
            "2025 Christmas – White & Gold (Solo/Duo)",
            "2025 Christmas – White & Gold (Small Group)",
            "2025 Christmas – White & Gold (Big Group)",
          ],
        },
      },
    };

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(defaultTaxonomy);
    }

    // Fetch enabled services from Notion
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
              equals: true,
            },
          },
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
      return NextResponse.json(defaultTaxonomy);
    }

    const data = await response.json();

    // Build dynamic taxonomy
    const types = new Set<string>();
    const categories = new Set<string>();
    const groups: Record<string, Set<string>> = {};
    const services: Record<string, Record<string, string[]>> = {};

    data.results.forEach((page: any) => {
      const props = page.properties;
      const serviceType = props.Type?.select?.name || "Self-Shoot";
      const serviceGroup = props.Group?.rich_text?.[0]?.plain_text || "";
      const serviceName = props.Name?.title?.[0]?.plain_text || "";
      const serviceCategory = props.Category?.select?.name;

      // Collect types
      if (serviceType) {
        types.add(serviceType);
      }

      // Collect categories
      if (serviceCategory) {
        categories.add(serviceCategory);
      }

      // Collect groups
      if (serviceType && serviceGroup) {
        if (!groups[serviceType]) {
          groups[serviceType] = new Set();
        }
        groups[serviceType].add(serviceGroup);
      }

      // Collect services
      if (serviceType && serviceGroup && serviceName) {
        if (!services[serviceType]) {
          services[serviceType] = {};
        }
        if (!services[serviceType][serviceGroup]) {
          services[serviceType][serviceGroup] = [];
        }
        services[serviceType][serviceGroup].push(serviceName);
      }
    });

    // Convert Sets to Arrays
    const taxonomy = {
      types: Array.from(types),
      categories: Array.from(categories).length > 0 ? Array.from(categories) : ["Classic", "Digital"],
      groups: Object.fromEntries(
        Object.entries(groups).map(([type, groupSet]) => [type, Array.from(groupSet)])
      ),
      services: Object.fromEntries(
        Object.entries(services).map(([type, groupServices]) => [
          type,
          groupServices,
        ])
      ),
    };

    return NextResponse.json(taxonomy);
  } catch (error) {
    console.error("Error building taxonomy:", error);
    // Return default on error
    return NextResponse.json({
      types: ["Self-Shoot", "With Photographer", "Seasonal Sessions"],
      categories: ["Classic", "Digital"],
      groups: {
        "Self-Shoot": ["Solo/Duo", "Small Group", "Big Group"],
        "With Photographer": [
          "Kids Pre-birthday (Girls)",
          "Kids Pre-birthday (Boys)",
          "Adult/Family Shoot",
        ],
        "Seasonal Sessions": ["Christmas"],
      },
      services: {},
    });
  }
}
