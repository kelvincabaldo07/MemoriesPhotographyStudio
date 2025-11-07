import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "data", "services-config.json");

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDataDir();
    
    let services;
    try {
      const data = await fs.readFile(CONFIG_FILE, "utf-8");
      services = JSON.parse(data);
    } catch {
      // File doesn't exist, use defaults
      services = DEFAULT_SERVICES;
      // Save defaults
      await fs.writeFile(CONFIG_FILE, JSON.stringify(services, null, 2));
    }

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error reading services config:", error);
    return NextResponse.json(
      { error: "Failed to read services configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, index, service } = await request.json();
    
    await ensureDataDir();

    // Read current config
    let services;
    try {
      const data = await fs.readFile(CONFIG_FILE, "utf-8");
      services = JSON.parse(data);
    } catch {
      services = DEFAULT_SERVICES;
    }

    // Perform action
    if (action === "add") {
      services.push(service);
    } else if (action === "update" && typeof index === "number" && index >= 0) {
      services[index] = service;
    } else if (action === "delete" && typeof index === "number" && index >= 0) {
      services.splice(index, 1);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Save updated config
    await fs.writeFile(CONFIG_FILE, JSON.stringify(services, null, 2));

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("Error updating services config:", error);
    return NextResponse.json(
      { error: "Failed to update services configuration" },
      { status: 500 }
    );
  }
}
