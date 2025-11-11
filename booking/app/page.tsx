"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, ImageIcon, Info, XCircle, ArrowUp, ArrowDown, Eye, Heart, Plus, ShieldCheck, ShoppingBag, User, Phone, Mail, X as CloseIcon, Globe } from 'lucide-react';
// import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { twMerge as cn } from "tailwind-merge";
// import {
//   ChevronRight,
//   ChevronLeft,
//   Info,
//   CheckCircle2,
//   Clock,
//   XCircle,
//   Image as ImageIcon,
//   ShieldCheck,
//   ChevronDown,
//   ChevronUp,
// } from "lucide-react";

/**
 * Memories Photography Studio – Booking App (sleek accordions, production build)
 *
 * - One-step service picker with clear accordions + chevrons
 * - Hides non-selected branches for a sleek view
 * - Poster-style descriptions + price badges
 * - Tiny thumbnails for Groups
 * - CSS animation for expand/collapse (no extra deps)
 * - Running total (session + add-ons) in Review + sticky mini-summary
 * - ✅ TestPanel removed for production
 */

// ---------- Configuration ----------
const STUDIO_TZ = "Asia/Manila";

// Add type definition
type ShopHours = {
  open: number;
  close: number;
  lunchBreak?: { start: number; end: number } | null;
};

// Studio hours by day of week
const SHOP_HOURS_BY_DAY: Record<number, ShopHours> = {
  0: { open: 13, close: 20, lunchBreak: null }, // Sunday: 1 PM - 8 PM (no lunch break)
  1: { open: 8, close: 20, lunchBreak: { start: 12, end: 13 } },  // Monday: 8 AM - 8 PM (lunch 12-1)
  2: { open: 8, close: 20, lunchBreak: { start: 12, end: 13 } },  // Tuesday: 8 AM - 8 PM (lunch 12-1)
  3: { open: 8, close: 20, lunchBreak: { start: 12, end: 13 } },  // Wednesday: 8 AM - 8 PM (lunch 12-1)
  4: { open: 8, close: 20, lunchBreak: { start: 12, end: 13 } },  // Thursday: 8 AM - 8 PM (lunch 12-1)
  5: { open: 8, close: 20, lunchBreak: { start: 12, end: 13 } },  // Friday: 8 AM - 8 PM (lunch 12-1)
  6: { open: 10, close: 20, lunchBreak: { start: 12, end: 13 } }, // Saturday: 10 AM - 8 PM (lunch 12-1)
};
const SHOP_HOURS = { open: 8, close: 20 }; // Default for general calculations
const SLOT_MINUTES = 15; // 15-minute increments for display
const BUFFER_MINUTES = 30; // 30-min buffer between sessions
const MIN_SESSION_DURATION = 45; // Minimum booking duration (for slot count calculation)
// Service-specific restrictions - will be loaded from API
type ServiceRestriction = {
  availableFrom?: number;
  availableUntil?: number;
  allowedDates?: string[];
};

const SERVICE_RESTRICTIONS: Record<string, ServiceRestriction> = {
  // Default restrictions (fallback if API fails)
  "With Photographer": {
    availableFrom: 8,
    availableUntil: 18,
  },
  "Seasonal Sessions": {
    allowedDates: [
      "2025-11-21", "2025-11-28", "2025-12-05", "2025-12-06", "2025-12-13",
      "2026-11-21", "2026-11-28", "2026-12-05", "2026-12-06", "2026-12-13",
    ]
  }
};

// Studio brand colors - earthy, natural palette
const BRAND = {
  charcoal: "#2C2C2C",      // Regular text
  cream: "#FAF3E0",          // Background
  white: "#FFFFFF",
  forest: "#0b3d2e",         // Main brand color - titles, selections, primary buttons
  terracotta: "#A62F20",     // Secondary accent (kept for variety)
  clay: "#8B5E3C",           // Secondary accent (kept for variety)
};

// const BACKDROPS = [
//   { key: "tan", name: "Tan", swatch: "#D2B48C" },
//   { key: "lemon", name: "Lemon Yellow", swatch: "#FFE45E" },
//   { key: "mardi", name: "Mardi Gras", swatch: "#880085" },
//   { key: "ivory", name: "Ivory", swatch: "#FFFFF0" },
//   { key: "gray", name: "Gray", swatch: "#BDBDBD" },
//   { key: "bluegreen", name: "Blue Green", swatch: "#0FA3B1" },
//   { key: "lotus", name: "Lotus Root Pink", swatch: "#F4C2C2" },
// ];
const BACKDROPS = [
  { key: "gray", name: "Gray", swatch: "#838383", image: "/backdrops/gray.jpg" },
  { key: "mugwort", name: "Mugwort", swatch: "#99FFBB", image: "/backdrops/mugwort.jpg" },
  { key: "beige", name: "Beige", swatch: "#F7D69D", image: "/backdrops/beige.jpg" },
  { key: "ivory", name: "Ivory", swatch: "#FFFFF0", image: "/backdrops/ivory.jpg" },
  { key: "lightblue", name: "Light Blue", swatch: "#ADD8E6", image: "/backdrops/lightblue.jpg" },
  { key: "flamered", name: "Flame Red", swatch: "#800000", image: "/backdrops/flamered.jpg" },
  { key: "carnationpink", name: "Carnation Pink", swatch: "#FFA6C9", image: "/backdrops/carnationpink.jpg" },
];

const CHRISTMAS_2025 = {
  title: "2025 Christmas – White & Gold",
  desc: "Elegant, cozy, and timeless.",
};

// Services / Flow taxonomy
const TAXONOMY = {
  types: ["Self-Shoot", "With Photographer", "Seasonal Sessions"] as const,
  categories: ["Classic", "Digital"] as const, // Classic = with prints, Digital = all-digital
  groups: {
    "Self-Shoot": ["Solo/Duo", "Small Group", "Big Group"],
    "With Photographer": [
      "Kids Pre-birthday (Girls)",  // FIXED: Added closing quote and parenthesis
      "Kids Pre-birthday (Boys)",
      "Adult/Family Shoot",
    ],
    "Seasonal Sessions": ["Christmas"],
  },
  services: {
    // Self-Shoot packages
    "Self-Shoot": {
      "Solo/Duo": ["Solo/Duo 15", "Solo/Duo 30", "Solo/Duo 60"],
      "Small Group": ["Small Group 15", "Small Group 30", "Small Group 60"],
      "Big Group": ["Big Group 30", "Big Group 60"],
    },
    // With Photographer themes / types
    "With Photographer": {
      "Kids Pre-birthday (Girls)": [
        "Dreamy Rainbow Theme",
        "Bloom & Blush Theme",
        "Rainbow Boho Theme",
        "Pastel Daisies Theme",
        "Butterfly Theme",
        "Cuddly Bear Theme",
        "Mermaid Theme",
        "Hot Air Balloon Theme",
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
      "Adult/Family Shoot": ["Adult’s Pre-Birthday", "Maternity Photoshoot", "Family/Group Portraits"],
    },
    // Seasonal
    "Seasonal Sessions": {
      Christmas: [
        "2025 Christmas – White & Gold (Solo/Duo)",
        "2025 Christmas – White & Gold (Small Group)",
        "2025 Christmas – White & Gold (Big Group)",
      ],
    },
  },
} as const;

// Detailed service info (descriptions & prices)
const SERVICE_INFO: Record<string, { details: string; price: number; digitalPrice?: number; classicDetails?: string }> = {
  // Self-shoot - Digital & Classic variants
  "Solo/Duo 15": { 
    details: "1–2 pax\nUNLIMITED shots for 15 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    price: 250,
    classicDetails: "1–2 pax\nUNLIMITED shots for 15 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nPrinted Copies (1 4R (4x6) and 2 photostrips)\n5 mins photo selection (Select up to 7 photos)"
  },
  "Solo/Duo 30": { 
    details: "1–2 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 400,
    classicDetails: "1–2 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nPrinted Copies (1 4R (4x6) and 2 photostrips)\n5 mins photo selection (Select up to 7 photos)"
  },
  "Solo/Duo 60": { 
    details: "1–2 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 700,
    classicDetails: "1–2 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nPrinted Copies (1 4R (4x6) and 4 Wallet Size (2x3) or 2 photostrips)\n10 mins photo selection (Select up to 7 photos)"
  },

  "Small Group 15": { 
    details: "3–5 pax\nUNLIMITED shots for 15 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 350,
    classicDetails: "3–5 pax\nUNLIMITED shots for 15 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nPrinted Copies (1 4R (4x6) and 2 photostrips)\n5 mins photo selection (Select up to 7 photos)"
  },
  "Small Group 30": { 
    details: "3–5 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 600,
    classicDetails: "3–5 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nPrinted Copies (1 4R (4x6) and 2 photostrips)\n5 mins photo selection (Select up to 7 photos)"
  },
  "Small Group 60": { 
    details: "3–5 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 1000,
    classicDetails: "3–5 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nPrinted Copies (1 4R (4x6) and 4 Wallet Size (2x3) or 2 photostrips)\n10 mins photo selection (Select up to 7 photos)"
  },

  "Big Group 30": { 
    details: "6–15 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 800,
    classicDetails: "6–15 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nPrinted Copies (1 4R (4x6) and 2 photostrips)\n5 mins photo selection (Select up to 7 photos)"
  },
  "Big Group 60": { 
    details: "6–15 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 1500,
    classicDetails: "6–15 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nPrinted Copies (1 4R (4x6) and 4 Wallet Size (2x3) or 2 photostrips)\n10 mins photo selection (Select up to 7 photos)"
  },
  // With photographer (45 min)
  "Adult’s Pre-Birthday": { details: "45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Family/Group Portraits": { details: "3–8 pax\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Maternity Photoshoot": { details: "45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  // Kids themes (45 min, with photographer)
  "Racing Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Safari Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Outer Space Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Hot Air Balloon Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Cuddly Bear Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Under the Sea Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Train Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Navy Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Dreamy Rainbow Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Bloom & Blush Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Rainbow Boho Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Pastel Daisies Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Butterfly Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
  "Mermaid Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },

  // Seasonal Christmas
  "2025 Christmas – White & Gold (Solo/Duo)": { details: "1–2 pax\n45 minutes session in our airconditioned studio\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 10 days)\nCozy white & gold set", price: 1000 },
  "2025 Christmas – White & Gold (Small Group)": { details: "3–5 pax\n45 minutes session in our airconditioned studio\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 10 days)\nCozy white & gold set", price: 2000 },
  "2025 Christmas – White & Gold (Big Group)": { details: "6–8 pax\n45 minutes session in our airconditioned studio\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 10 days)\nCozy white & gold set", price: 2500 },
};

// UI thumbnails (emoji-based for now)
const GROUP_THUMBS: Record<string, string> = {
  "Solo/Duo": "👫",
  "Small Group": "👨‍👩‍👧",
  "Big Group": "👨‍👩‍👧‍👦",
  "Kids Pre-birthday (Girls)": "🎀",
  "Kids Pre-birthday (Boys)": "🚂",
  "Adult/Family Shoot": "👪",
  "Christmas": "🎄",
};

// Optional add-ons
const ADDONS = [
  { id: "4r", label: "Printed 1 4R photo", price: 30 },
  { id: "photostrip", label: "Printed 2 photo strips", price: 30 },
  { id: "wallet", label: "Printed 4 wallet size photos", price: 30 },
  { id: "premium4r", label: "Printed 1 4R photo (Canon Selphy CP1500)", price: 50 },
];

// Demo bookings
const EXISTING_BOOKINGS = [
  { date: offsetDate(0), start: "10:00", duration: 30 },
  { date: offsetDate(0), start: "13:30", duration: 60 },
  { date: offsetDate(1), start: "11:15", duration: 45 },
];

function offsetDate(days = 0) {
  // Get Manila date directly using Intl API
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: STUDIO_TZ, 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  
  if (days === 0) {
    return `${year}-${month}-${day}`;
  }
  
  // For offset days, use the Manila date as base
  const manilaDate = new Date(`${year}-${month}-${day}T00:00:00`);
  manilaDate.setDate(manilaDate.getDate() + days);
  return manilaDate.toISOString().slice(0, 10);
}

// ---------- Utils ----------
function pad(n: number) { return n.toString().padStart(2, "0"); }
// Get shop hours for a specific date
function getShopHoursForDate(dateStr: string): ShopHours {
  const date = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return SHOP_HOURS_BY_DAY[dayOfWeek];
}
function toMinutes(hhmm: string) { const [h,m] = hhmm.split(":").map(Number); return h*60+m; }
function toHHMM(mins: number) { const h = Math.floor(mins/60), m = mins%60; return `${pad(h)}:${pad(m)}`; }
function range(start: number, end: number, step: number){ const out:number[]=[]; for(let x=start;x<=end;x+=step) out.push(x); return out; }
function generateDailySlots(dateStr?: string, duration: number = MIN_SESSION_DURATION, buffer: number = BUFFER_MINUTES, slotSize: number = SLOT_MINUTES){ 
  const hours: ShopHours = dateStr ? getShopHoursForDate(dateStr) : { ...SHOP_HOURS, lunchBreak: null };
  const start = hours.open * 60;
  const end = hours.close * 60;
  
  // Calculate the latest possible start time
  const latestStartTime = end - duration - buffer;
  
  // Generate all slots up to the latest valid start time
  const allSlots = range(start, latestStartTime, slotSize).map(toHHMM);
  
  // Filter out lunch break if applicable
  if (hours.lunchBreak) {
    const lunchStart = hours.lunchBreak.start * 60;
    const lunchEnd = hours.lunchBreak.end * 60;
    
    return allSlots.filter(slot => {
      const slotMinutes = toMinutes(slot);
      const slotEnd = slotMinutes + duration + buffer; // Session end time including buffer
      
      // Slot is valid if:
      // 1. It ends before lunch starts, OR
      // 2. It starts after lunch ends
      return slotEnd <= lunchStart || slotMinutes >= lunchEnd;
    });
  }
  
  return allSlots;
}
function buildBlockedMap(date: string, existing: {date:string; start:string; duration:number}[], bufferMins=BUFFER_MINUTES){
  const hours = getShopHoursForDate(date);
  const blocks:[number,number][]=[];
  
  // Add lunch break as a blocked range
  if (hours.lunchBreak) {
    blocks.push([hours.lunchBreak.start * 60, hours.lunchBreak.end * 60]);
  }
  
  // Add existing bookings as blocked ranges
  for(const b of existing.filter(x=>x.date===date)){
    const s=toMinutes(b.start)-bufferMins; 
    const e=toMinutes(b.start)+b.duration+bufferMins;
    blocks.push([Math.max(s, hours.open*60), Math.min(e, hours.close*60)]);
  }
  
  return blocks;
}
// Check if a date is allowed for a service type
function isDateAllowedForService(dateStr: string, serviceType: string, restrictions: Record<string, ServiceRestriction>): boolean {
  const typeRestrictions = restrictions[serviceType];
  if (!typeRestrictions?.allowedDates) return true;
  
  // Check if the date is in the allowed dates list
  return typeRestrictions.allowedDates.includes(dateStr);
}

// Filter time slots based on service type
function filterSlotsByService(slots: string[], serviceType: string, restrictions: Record<string, ServiceRestriction>): string[] {
  const typeRestrictions = restrictions[serviceType];
  if (!typeRestrictions?.availableFrom || !typeRestrictions?.availableUntil) return slots;
  
  const fromMinutes = typeRestrictions.availableFrom * 60;
  const untilMinutes = typeRestrictions.availableUntil * 60;
  
  return slots.filter(slot => {
    const slotMinutes = toMinutes(slot);
    return slotMinutes >= fromMinutes && slotMinutes < untilMinutes;
  });
}
// ✅ FIXED syntax here
function isSlotAvailable(slotHHMM: string, duration: number, blocked:[number,number][]): boolean {
  const s=toMinutes(slotHHMM), e=s+duration; 
  return blocked.every(([bs,be])=> e<=bs || s>=be); 
}
function inferDuration(serviceLabel?: string){ if(!serviceLabel) return 30; if(/(15)/i.test(serviceLabel)) return 15; if(/(60)/i.test(serviceLabel)) return 60; return 30; }
function backdropLimitByDuration(mins: number){ return mins>=60?4:2; }
function currency(n:number){ return new Intl.NumberFormat("en-PH", { style:"currency", currency:"PHP"}).format(n); }
function to12Hour(hhmm: string) { 
  const [h, m] = hhmm.split(":").map(Number); 
  const period = h >= 12 ? "PM" : "AM"; 
  const hour12 = h % 12 || 12; 
  return `${hour12}:${pad(m)} ${period}`; 
}
// ---------- Main Component ----------
export default function App(){
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const bookingInProgress = useRef(false);

  // Selections
  const [serviceType, setServiceType] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [serviceGroup, setServiceGroup] = useState("");
  const [service, setService] = useState("");
  
  // Dynamic service restrictions from API
  const [serviceRestrictions, setServiceRestrictions] = useState<Record<string, ServiceRestriction>>(SERVICE_RESTRICTIONS);
  
  // Dynamic service info from API (descriptions, prices)
  const [serviceInfo, setServiceInfo] = useState<Record<string, { details: string; price: number; classicDetails?: string }>>(SERVICE_INFO);

  // Booking policies from admin settings
  const [bookingPolicies, setBookingPolicies] = useState({
    leadTime: 2,
    leadTimeUnit: 'hours' as 'minutes' | 'hours' | 'days',
    bookingSlotSize: 15,
    bookingSlotUnit: 'minutes' as 'minutes' | 'hours',
    schedulingWindow: 90,
    schedulingWindowUnit: 'days' as 'days' | 'months',
    cancellationPolicy: 2,
    cancellationPolicyUnit: 'hours' as 'hours' | 'days',
  });

  // Schedule
  const [date, setDate] = useState(offsetDate(0));
  const [time, setTime] = useState("");

  // Customer
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddr] = useState("");
  //Email verification
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  
  // Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
    // Social / event consent - CHANGED: Single required field
  const [socialConsent, setSocialConsent] = useState<"yes" | "no" | "">("");
  const [eventType, setEventType] = useState("");
  const [celebrantName, setCelebName] = useState("");
  const [birthdayAge, setBirthdayAge] = useState("");
  const [graduationLevel, setGradLevel] = useState("");
  const [eventDate, setEventDate] = useState(""); // ADD THIS LINE
  
  // Self-shoot backdrops
  const duration = useMemo(()=>inferDuration(service), [service]);
  const bdLimit = backdropLimitByDuration(duration);
  const [selectedBackdrops, setSelectedBackdrops] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // Add-ons
  const [addons, setAddons] = useState<Record<string, number>>({});

  // Terms - Individual agreement tracking
  const [acceptedPhotoDelivery, setAcceptedPhotoDelivery] = useState(false);
  const [acceptedLocation, setAcceptedLocation] = useState(false);
  const [acceptedParking, setAcceptedParking] = useState(false);
  const [acceptedBookingPolicy, setAcceptedBookingPolicy] = useState(false);

  // Load booking policies from API on mount
  useEffect(() => {
    fetch('/api/booking-settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.settings) {
          console.log('📅 Loaded booking policies:', data.settings);
          setBookingPolicies(data.settings);
        }
      })
      .catch(err => console.error('Failed to load booking policies:', err));
  }, []);

  // Load service data from API on mount
  useEffect(() => {
    console.log('🔄 Loading service data from API...');
    fetch('/api/admin/services/config')
      .then(res => res.json())
      .then(data => {
        console.log('📦 Received service data:', data);
        if (data.services) {
          const restrictions: Record<string, ServiceRestriction> = {};
          const info: Record<string, { details: string; price: number; classicDetails?: string }> = {};
          
          // Build restrictions and info from services data
          data.services.forEach((svc: any) => {
            // Time-based restrictions (for "With Photographer")
            if (svc.availableFrom !== undefined && svc.availableUntil !== undefined) {
              if (!restrictions[svc.type]) {
                restrictions[svc.type] = {};
              }
              restrictions[svc.type].availableFrom = svc.availableFrom;
              restrictions[svc.type].availableUntil = svc.availableUntil;
            }
            
            // Date-based restrictions (for "Seasonal Sessions")
            if (svc.specificDates && svc.specificDates.length > 0) {
              if (!restrictions[svc.type]) {
                restrictions[svc.type] = {};
              }
              // Merge all specific dates for this type
              const existing = restrictions[svc.type].allowedDates || [];
              restrictions[svc.type].allowedDates = [...new Set([...existing, ...svc.specificDates])];
            }
            
            // Service descriptions and prices - handle both Classic and Digital services
            if (svc.name) {
              // Services in Notion have "Digital " or "Classic " prefix
              // But booking page uses base names like "Solo/Duo 15"
              const baseServiceName = svc.name.replace(/^(Classic |Digital )/, '');
              
              console.log(`Processing service: ${svc.name} -> ${baseServiceName} (Category: ${svc.category})`);
              
              // Initialize entry if it doesn't exist
              if (!info[baseServiceName]) {
                info[baseServiceName] = {
                  details: "",
                  price: 0,
                };
              }
              
              // If it's a Classic service, store classic details and price
              if (svc.category === "Classic") {
                info[baseServiceName].classicDetails = svc.description || "";
                // Classic price is base price, Digital is 50 less
                info[baseServiceName].price = (svc.basePrice || 0) - 50;
              } else {
                // Digital or no category - use as base details and price
                info[baseServiceName].details = svc.description || "";
                info[baseServiceName].price = svc.basePrice || 0;
              }
            }
          });
          
          console.log('✅ Built service info:', info);
          console.log('✅ Built restrictions:', restrictions);
          
          // Update state with API data
          if (Object.keys(restrictions).length > 0) {
            setServiceRestrictions(prev => ({ ...prev, ...restrictions }));
          }
          if (Object.keys(info).length > 0) {
            setServiceInfo(prev => ({ ...prev, ...info }));
          }
        }
      })
      .catch(err => {
        console.error('❌ Failed to load service data:', err);
        // Keep using defaults on error
      });
  }, []);

  // Totals
  const sessionPrice = useMemo(() => {
    const baseInfo = serviceInfo[service];
    if (!baseInfo) return 0;
    // Add ₱50 for Classic category
    return serviceCategory === "Classic" ? baseInfo.price + 50 : baseInfo.price;
  }, [service, serviceCategory, serviceInfo]);
  const addonsTotal = useMemo(() => Object.entries(addons).reduce((sum,[id,qty])=>{
    const item = ADDONS.find(a=>a.id===id); return sum + (item ? (item.price * (qty||0)) : 0);
  },0), [addons]);
  const grandTotal = sessionPrice + addonsTotal;

  // Clear cache when service changes (duration changes)
  useEffect(() => {
    if (duration) {
      sessionStorage.clear(); // Clear slot cache when changing services
    }
  }, [duration]);

  // Convert slot size to minutes for slot generation
  const slotSizeMinutes = useMemo(() => {
    return bookingPolicies.bookingSlotUnit === 'hours' 
      ? bookingPolicies.bookingSlotSize * 60 
      : bookingPolicies.bookingSlotSize;
  }, [bookingPolicies.bookingSlotSize, bookingPolicies.bookingSlotUnit]);

  const slots = useMemo(()=>generateDailySlots(undefined, MIN_SESSION_DURATION, BUFFER_MINUTES, slotSizeMinutes), [slotSizeMinutes]);
  const blocked = useMemo(()=>buildBlockedMap(date, EXISTING_BOOKINGS), [date]);
  const availableSlots = useMemo(()=> slots.filter((s)=>isSlotAvailable(s, duration, blocked)), [slots, duration, blocked]);

  const allocationValid = useMemo(()=>{
    const needsBackdrops = serviceType === "Self-Shoot" || (serviceType === "With Photographer" && serviceGroup === "Adult/Family Shoot");
    if (!needsBackdrops) return true;
    const total = Object.values(allocations).reduce((a,b)=>a+(Number(b)||0),0);
    const countOk = selectedBackdrops.length>0 && selectedBackdrops.length<=bdLimit;
    return countOk && total===duration;
  }, [allocations, selectedBackdrops, bdLimit, duration, serviceType, serviceGroup]);

  function toggleAddon(id: string, delta: number){ setAddons(prev=>{ const qty=Math.max(0,(prev[id]||0)+delta); return { ...prev, [id]: qty };}); }
  function moveBackdrop(idx:number,dir:number){ setSelectedBackdrops(prev=>{ const arr=[...prev]; const swap=idx+dir; if(swap<0||swap>=arr.length) return prev; [arr[idx],arr[swap]]=[arr[swap],arr[idx]]; return arr; }); }
  function onBackdropToggle(key:string){ 
    setSelectedBackdrops(prev=>{ 
      if(prev.includes(key)) {
        // Removing backdrop
        const newBackdrops = prev.filter(k=>k!==key);
        // Recalculate allocations
        if (newBackdrops.length > 0) {
          const perBackdrop = Math.floor(duration / newBackdrops.length);
          const remainder = duration % newBackdrops.length;
          const newAlloc: Record<string, number> = {};
          newBackdrops.forEach((bd, idx) => { 
            // Give the remainder to the first backdrop(s)
            newAlloc[bd] = perBackdrop + (idx < remainder ? 1 : 0);
          });
          setAllocations(newAlloc);
        } else {
          setAllocations({});
        }
        return newBackdrops;
      }
      if(prev.length>=bdLimit) return prev;
      
      // Adding backdrop
      const newBackdrops = [...prev, key];
      const perBackdrop = Math.floor(duration / newBackdrops.length);
      const remainder = duration % newBackdrops.length;
      const newAlloc: Record<string, number> = {};
      newBackdrops.forEach((bd, idx) => { 
        // Give the remainder to the first backdrop(s)
        newAlloc[bd] = perBackdrop + (idx < remainder ? 1 : 0);
      });
      setAllocations(newAlloc);
      return newBackdrops;
    }); 
  }
  function onAllocationChange(key:string,value:string){ const v=Math.max(0, Number(value)||0); setAllocations(prev=>({ ...prev, [key]: v })); }

async function submitBooking(){
  console.log('🎯 submitBooking called!');
  
  // Prevent duplicate submissions
  if (bookingInProgress.current) {
    console.warn('⚠️ Booking already in progress, ignoring duplicate call');
    return;
  }
  
  bookingInProgress.current = true;
  setBusy(true);
  
  const payload = {
    createdAt: new Date().toISOString(), 
    timezone: STUDIO_TZ,
    selections: { serviceType, serviceCategory, serviceGroup, service, duration },
    schedule: { date, time, buffer: BUFFER_MINUTES },
    customer: { firstName, lastName, email, phone, address },
    consent: { socialConsent, eventType, celebrantName, birthdayAge, graduationLevel, eventDate },
    selfShoot: serviceType === "Self-Shoot" ? { backdrops: selectedBackdrops, allocations } : null,
    addons,
    totals: { sessionPrice, addonsTotal, grandTotal }
  };
  
  console.log('📤 About to send payload:', payload);
  
  try {
    console.log('🌐 Calling fetch /api/bookings...');
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Fetch response received, status:', response.status);
    const result = await response.json();
    console.log('📋 Result:', result);
    
    if (result.success) {
      console.log('✅ Booking created:', result.bookingId);
      setStep(STEPS.length-1); // Go to confirmation
    } else {
      console.error('❌ Booking failed:', result.error);
      setModalMessage('Failed to create booking. Please try again.');
      setShowErrorModal(true);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    setModalMessage('Network error. Please check your connection.');
    setShowErrorModal(true);
  } finally {
    console.log('🏁 setBusy(false)');
    setBusy(false);
    bookingInProgress.current = false;
  }
}

  const canContinue = useMemo(()=>{
    switch(step){
      case 0: return !!service;
      case 1: return !!date && !!time;
      case 2: {
        const result = !!firstName && !!lastName && !!email && !!phone && emailVerified;
        console.log('🔍 Step 2 validation:', {
          firstName: !!firstName,
          lastName: !!lastName,
          email: !!email,
          phone: !!phone,
          emailVerified,
          canContinue: result
        });
        return result;
      }
      case 3: { // consent conditional questions - CHANGED
        if (!socialConsent) return false; // Always required
        
        const isPreBirthday = serviceGroup === "Kids Pre-birthday (Girls)" || serviceGroup === "Kids Pre-birthday (Boys)";
        const isChristmas = serviceType === "Seasonal Sessions";
        
        // Pre-birthday: always need name & age, and if YES consent, also need date
        if (serviceType === "With Photographer" && isPreBirthday) {
          if (!celebrantName || !birthdayAge) return false;
          if (socialConsent === "yes" && !eventDate) return false; // ADD THIS LINE
        }
        
        // Christmas or if they said "yes" to social consent
        if (socialConsent === "yes"){
          if (isChristmas) {
            // Christmas: need celebrant name only
            if (!celebrantName) return false;
          } else if (!isPreBirthday) { // CHANGED: Only for non-pre-birthday
            // All other cases
            if (!eventType || !celebrantName) return false;
            if (eventType === "Birthday" && (!birthdayAge || !eventDate)) return false;
            if (eventType === "Graduation/Moving Up" && (!graduationLevel || !eventDate)) return false;
            if (["Prenup", "Wedding", "Monthsary", "Anniversary", "Maternity", "Other"].includes(eventType) && !eventDate) return false;
          }
        }
        
        // If they said "no" to consent: 
        // - Self-Shoot: no event details needed, go straight to backdrops
        // - With Photographer: still need event type and celebrant name, but no dates
        if (socialConsent === "no" && !isChristmas && !isPreBirthday) {
          if (serviceType !== "Self-Shoot") {
            if (!eventType || !celebrantName) return false;
            if (eventType === "Birthday" && !birthdayAge) return false;
            if (eventType === "Graduation/Moving Up" && !graduationLevel) return false;
          }
          // For Self-Shoot with "no" consent: no validation needed, skip to backdrops
        }
        return true;
      }
      case 4: return serviceType !== "Self-Shoot" ? true : allocationValid; // backdrops
      case 5: return true; // add-ons optional
      case 6: return acceptedPhotoDelivery && acceptedLocation && acceptedParking && acceptedBookingPolicy; // all terms must be accepted
      case 7: return true; // review
      default: return false;
    }
  }, [step, service, date, time, firstName, lastName, email, phone, emailVerified, socialConsent, eventType, celebrantName, birthdayAge, graduationLevel, eventDate, allocationValid, acceptedPhotoDelivery, acceptedLocation, acceptedParking, acceptedBookingPolicy, serviceType, serviceGroup]);

  return (
    <div className="min-h-screen w-full flex items-start justify-center p-4 md:p-8 pb-28 md:pb-32" style={{ backgroundColor: BRAND.cream }}>
      {/* Modals */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={() => {
          setStep(0);
          setServiceType("");
          setServiceCategory("");
          setServiceGroup("");
          setService("");
        }}
        title="Start Over?"
        message="Are you sure you want to restart? All your current selections will be lost."
        type="warning"
        confirmText="Yes, Start Over"
        cancelText="Cancel"
      />
      
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        message={modalMessage}
        type="success"
      />
      
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={modalMessage}
        type="error"
      />

      <div className="w-full max-w-5xl">
        {/* Simple Logo/Title Header */}
        <div className="text-center mb-6 pt-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src="/logo.png" 
              alt="Memories Photography Studio" 
              className="w-12 h-12 md:w-14 md:h-14"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight" style={{ color: BRAND.forest }}>
                Memories Photography Studio
              </h1>
              <p className="text-xs text-neutral-500">Capture With Purpose. Create Change.</p>
            </div>
          </div>
        </div>

        <Stepper step={step} />

        <Card className="mt-8 shadow-lg border-0 relative overflow-visible">
          {/* Sticky mini-summary */}
          <div className="hidden md:flex items-center gap-3 absolute -top-3 right-3 bg-white/90 backdrop-blur rounded-xl border px-3 py-2 shadow-sm">
            <div className="text-xs text-neutral-500">Total</div>
            <div className="font-semibold">{currency(grandTotal)}</div>
          </div>

          <CardContent className="p-4 md:p-6">
            {step === 0 && (
              <StepServiceUnified
                serviceType={serviceType}
                setServiceType={setServiceType}
                serviceCategory={serviceCategory}
                setServiceCategory={setServiceCategory}
                serviceGroup={serviceGroup}
                setServiceGroup={setServiceGroup}
                service={service}
                setService={(s:string)=>{ setService(s); }}
                serviceInfo={serviceInfo}
              />
            )}

            {step === 1 && (
              <StepSchedule 
                date={date} 
                setDate={setDate} 
                time={time} 
                setTime={setTime} 
                duration={duration} 
                availableSlots={availableSlots} 
                serviceType={serviceType}
                serviceRestrictions={serviceRestrictions}
                bookingPolicies={bookingPolicies}
              />
            )}

            {step === 2 && (
              <StepCustomer 
                firstName={firstName} 
                lastName={lastName} 
                email={email} 
                phone={phone} 
                address={address} 
                setFirst={setFirst} 
                setLast={setLast} 
                setEmail={setEmail} 
                setPhone={setPhone} 
                setAddr={setAddr}
                emailVerified={emailVerified}
                setEmailVerified={setEmailVerified}
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
                sentCode={sentCode}
                setSentCode={setSentCode}
                setModalMessage={setModalMessage}
                setShowSuccessModal={setShowSuccessModal}
                setShowErrorModal={setShowErrorModal}
              />
            )}

            {step === 3 && (
              <StepConsent 
                serviceType={serviceType}
                serviceGroup={serviceGroup}
                socialConsent={socialConsent} 
                setSocialConsent={setSocialConsent} 
                eventType={eventType} 
                setEventType={setEventType} 
                celebrantName={celebrantName} 
                setCelebName={setCelebName} 
                birthdayAge={birthdayAge} 
                setBirthdayAge={setBirthdayAge} 
                graduationLevel={graduationLevel} 
                setGradLevel={setGradLevel}
                eventDate={eventDate}
                setEventDate={setEventDate}
              />
            )}

            {step === 4 && (
              <StepBackdrops 
                enabled={
                  serviceType === "Self-Shoot" || 
                  (serviceType === "With Photographer" && serviceGroup === "Adult/Family Shoot")
                } 
                duration={duration} 
                limit={bdLimit} 
                selected={selectedBackdrops} 
                onToggle={onBackdropToggle} 
                move={moveBackdrop} 
                allocations={allocations} 
                setAlloc={onAllocationChange} 
              />
            )}

            {step === 5 && (<StepAddons addons={addons} toggle={toggleAddon} />)}
            {step === 6 && (
              <StepVideoAndTerms 
                acceptedPhotoDelivery={acceptedPhotoDelivery}
                setAcceptedPhotoDelivery={setAcceptedPhotoDelivery}
                acceptedLocation={acceptedLocation}
                setAcceptedLocation={setAcceptedLocation}
                acceptedParking={acceptedParking}
                setAcceptedParking={setAcceptedParking}
                acceptedBookingPolicy={acceptedBookingPolicy}
                setAcceptedBookingPolicy={setAcceptedBookingPolicy}
              />
            )}
            {step === 7 && (
              <StepReview data={{ serviceType, serviceCategory, serviceGroup, service, duration, date, time, firstName, lastName, email, phone, address, socialConsent, eventType, celebrantName, birthdayAge, graduationLevel, eventDate, selectedBackdrops, allocations, addons, sessionPrice, addonsTotal, grandTotal }} />
            )}
            {step === 8 && (<Confirmation />)}

            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" onClick={()=>setStep(Math.max(step-1,0))} disabled={step===0}>
                <ChevronLeft className="w-4 h-4 mr-2"/> Back
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setShowResetModal(true)}
                className=""
              >
                Start Over
              </Button>

              {step < 7 && (
                <Button 
                  onClick={()=>setStep(step+1)} 
                  disabled={!canContinue}
                  style={{ 
                    backgroundColor: canContinue ? BRAND.forest : "#ccc", 
                    color: BRAND.white 
                  }}
                >
                  Next <ChevronRight className="w-4 h-4 ml-2"/>
                </Button>
              )}
              {step === 7 && (
                <Button 
                  onClick={submitBooking} 
                  disabled={!canContinue || busy}
                  style={{ 
                    backgroundColor: canContinue && !busy ? BRAND.forest : "#ccc", 
                    color: BRAND.white 
                  }}
                >
                  {busy?"Submitting…":"Confirm & Book"}
                </Button>
              )}
            </div>          
            </CardContent>
        </Card>

        <footer className="text-xs text-center text-neutral-500 mt-4">
          © {new Date().getFullYear()} Memories Photography Studio — "Capture With Purpose. Create Change."
        </footer>
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------

// Modern Modal Component
function Modal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "info" | "success" | "error" | "warning";
  confirmText?: string;
  cancelText?: string;
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-12 h-12 text-green-500" />;
      case "error":
        return <XCircle className="w-12 h-12 text-red-500" />;
      case "warning":
        return <Info className="w-12 h-12 text-amber-500" />;
      default:
        return <Info className="w-12 h-12" style={{ color: BRAND.forest }} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <CloseIcon className="w-5 h-5 text-gray-500" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-center mb-2" style={{ color: BRAND.charcoal }}>
          {title}
        </h3>

        {/* Message */}
        <p className="text-center text-gray-600 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          {onConfirm ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                {cancelText}
              </Button>
              <Button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1"
                style={{ backgroundColor: BRAND.forest, color: BRAND.white }}
              >
                {confirmText}
              </Button>
            </>
          ) : (
            <Button
              onClick={onClose}
              className="w-full"
              style={{ backgroundColor: BRAND.forest, color: BRAND.white }}
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { label: "Service", icon: ShoppingBag },
  { label: "Schedule", icon: Calendar },
  { label: "Details", icon: User },
  { label: "Event Info", icon: Heart },
  { label: "Backdrops", icon: ImageIcon },
  { label: "Add-ons", icon: Plus },
  { label: "Terms", icon: ShieldCheck },
  { label: "Review", icon: Eye },
  { label: "Done", icon: CheckCircle2 },
];

function Stepper({ step }:{ step:number }){
  return (
    <>
      {/* Progress indicator on left side */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
        <div className="bg-white rounded-2xl shadow-lg border p-4 space-y-3" style={{ borderColor: 'rgba(11, 61, 46, 0.1)' }}>
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isCompleted = i < step;
            
            return (
              <div
                key={i}
                className="flex items-center gap-3 group cursor-pointer"
              >
                {/* Step circle */}
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    isActive && "ring-2 ring-offset-2"
                  )}
                  style={{
                    backgroundColor: isActive ? BRAND.forest : isCompleted ? BRAND.forest : '#e5e7eb',
                    color: isActive || isCompleted ? BRAND.white : '#9ca3af',
                  }}
                >
                  {isCompleted ? '✓' : i + 1}
                </div>
                
                {/* Step label */}
                <span 
                  className={cn(
                    "text-sm font-medium transition-all whitespace-nowrap",
                    isActive ? "text-base" : "text-sm"
                  )}
                  style={{ 
                    color: isActive ? BRAND.forest : isCompleted ? BRAND.charcoal : '#9ca3af' 
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Tab Bar - Mobile/Tablet - Matches Admin Styling Exactly */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-5 gap-0">
          <button
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center justify-center py-2 px-1 transition relative"
          >
            <div className="flex flex-col items-center justify-center text-white dark:text-white">
              <div className="rounded-lg p-1.5 transition bg-[#0b3d2e] dark:bg-[#0b3d2e]">
                <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] mt-1 font-semibold text-[#0b3d2e] dark:text-white">Book</span>
            </div>
          </button>
          
          <button
            onClick={() => window.location.href = '/my-bookings'}
            className="flex flex-col items-center justify-center py-2 px-1 transition relative"
          >
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="rounded-lg p-1.5 transition">
                <Calendar className="w-5 h-5 stroke-2" />
              </div>
              <span className="text-[10px] mt-1 font-medium">Bookings</span>
            </div>
          </button>
          
          <button
            onClick={() => window.location.href = '/contact'}
            className="flex flex-col items-center justify-center py-2 px-1 transition relative"
          >
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="rounded-lg p-1.5 transition">
                <Phone className="w-5 h-5 stroke-2" />
              </div>
              <span className="text-[10px] mt-1 font-medium">Contact</span>
            </div>
          </button>
          
          <button
            onClick={() => window.location.href = '/location'}
            className="flex flex-col items-center justify-center py-2 px-1 transition relative"
          >
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="rounded-lg p-1.5 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <span className="text-[10px] mt-1 font-medium">Location</span>
            </div>
          </button>
          
          <button
            onClick={() => window.open('https://www.memories-studio.com', '_blank')}
            className="flex flex-col items-center justify-center py-2 px-1 transition relative"
          >
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="rounded-lg p-1.5 transition">
                <Globe className="w-5 h-5 stroke-2" />
              </div>
              <span className="text-[10px] mt-1 font-medium">Website</span>
            </div>
          </button>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 text-sm font-semibold text-[#0b3d2e] dark:text-white transition"
              >
                <ShoppingBag className="w-4 h-4" />
                Book Now
              </button>
              <button 
                onClick={() => window.location.href = '/my-bookings'}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-opacity-80 transition"
              >
                <Calendar className="w-4 h-4" />
                My Bookings
              </button>
              <button 
                onClick={() => window.location.href = '/contact'}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-opacity-80 transition"
              >
                <Phone className="w-4 h-4" />
                Contact Us
              </button>
              <button 
                onClick={() => window.location.href = '/location'}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-opacity-80 transition"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Our Location
              </button>
              <button 
                onClick={() => window.open('https://www.memories-studio.com', '_blank')}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-opacity-80 transition"
              >
                <Globe className="w-4 h-4" />
                Website
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            
            {/* Step indicator on desktop */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Step {step + 1} of {STEPS.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Unified one-step service selector with explicit accordions + prices + thumbnails
function StepServiceUnified({ serviceType, setServiceType, serviceCategory, setServiceCategory, serviceGroup, setServiceGroup, service, setService, serviceInfo }:{
  serviceType:string; setServiceType:(v:string)=>void;
  serviceCategory:string; setServiceCategory:(v:string)=>void;
  serviceGroup:string; setServiceGroup:(v:string)=>void;
  service:string; setService:(v:string)=>void;
  serviceInfo: Record<string, { details: string; price: number; classicDetails?: string }>;
}){
  const [openType, setOpenType] = useState<string>(serviceType || "");
  const [openCategory, setOpenCategory] = useState<string>(serviceCategory || "");
  const [openGroup, setOpenGroup] = useState<string>(serviceGroup || "");

  // Hide unselected branches: once chosen, only show the chosen card + its children, with a tiny "Change" button.
  const chosenTypeOnly = !!serviceType;
  const chosenCategoryOnly = !!serviceCategory;

  function toggleType(t:string){
    if (serviceType === t) { setServiceType(""); setOpenType(""); setServiceCategory(""); setOpenCategory(""); setServiceGroup(""); setOpenGroup(""); setService(""); return; }
    setServiceType(t); setOpenType(t); setServiceCategory(""); setOpenCategory(""); setServiceGroup(""); setOpenGroup(""); setService("");
  }
  function toggleCategory(c:string){
    if (serviceCategory === c) { setServiceCategory(""); setOpenCategory(""); setServiceGroup(""); setOpenGroup(""); setService(""); return; }
    setServiceCategory(c); setOpenCategory(c); setServiceGroup(""); setOpenGroup(""); setService("");
  }
  function toggleGroup(g:string){
    setServiceGroup(g===serviceGroup?"":g); setOpenGroup(g===openGroup?"":g); setService("");
  }

  // ✅ ADD THIS HELPER FUNCTION HERE
  function getGroupDescription(groupName: string): string {
    switch(groupName) {
      case "Solo/Duo": return "1–2 persons";
      case "Small Group": return "3–5 persons";
      case "Big Group": return "6–15 persons";
      default: return "Pick a theme / type";
    }
  }
  // Auto-select Digital for With Photographer and Seasonal Sessions
  useEffect(() => {
    if (serviceType && serviceType !== "Self-Shoot" && !serviceCategory) {
      setServiceCategory("Digital");
      setOpenCategory("Digital");
    }
  }, [serviceType, serviceCategory]);
  const groups = (serviceType ? TAXONOMY.groups[serviceType as keyof typeof TAXONOMY.groups] : []) || [];
  const services = (serviceType && serviceGroup ? (TAXONOMY.services?.[serviceType as keyof typeof TAXONOMY.services] as Record<string, readonly string[]>)?.[serviceGroup]||[] : []);

  return (
    <div>
      <h2 className="text-xl font-semibold">Pick a service</h2>
      <p className="text-neutral-600 mb-4">Tap to expand each level. Details & prices shown for each option.</p>

      {/* Types */}
      <div className="space-y-3">
        {(chosenTypeOnly ? [serviceType] : TAXONOMY.types).filter(Boolean).map((t)=> (
          <div 
            key={t as string} 
            className={cn(
              "border rounded-2xl overflow-hidden transition",
              openType === t && "shadow-md"
            )}
            style={{
              borderColor: openType === t ? BRAND.cream : "#e5e5e5",
              backgroundColor: openType === t ? BRAND.cream : "#fafafa"
            }}
          >
            <div className="flex items-center justify-between p-3 bg-neutral-50">
              <button className="text-left flex-1" onClick={()=>toggleType(String(t))}>
                <div className="font-medium">{t as string}</div>
                <div className="text-xs text-neutral-500">{t === "Self-Shoot" ? "Use our studio & triggers" : t === "With Photographer" ? "Guided session with our photographer" : "Limited-time sets like Christmas"}</div>
              </button>
              <div className="flex items-center gap-2">
                {serviceType && <Button size="sm" variant="outline" onClick={()=>{ setServiceType(""); setOpenType(""); setServiceCategory(""); setOpenCategory(""); setServiceGroup(""); setOpenGroup(""); setService(""); }}>Change</Button>}
                {openType===t ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
              </div>
            </div>

            {/* Categories */}
            {openType===t && (
              <div className="px-4 pb-4 animate-accordion">
                {/* Only show category selection for Self-Shoot */}
                {t === "Self-Shoot" ? (
                  <div className={cn("grid gap-3 mt-3", chosenCategoryOnly?"grid-cols-1":"md:grid-cols-2")}>                  
                    {(chosenCategoryOnly ? [serviceCategory] : TAXONOMY.categories).filter(Boolean).map((c)=> (
                      <div 
                        key={String(c)} 
                        className={cn(
                          "text-left border rounded-xl p-3 hover:shadow-sm transition flex items-start gap-3",
                          serviceCategory === c && "shadow-md"
                        )}
                        style={{
                          borderColor: serviceCategory === c ? BRAND.cream : "#e5e5e5",
                          backgroundColor: serviceCategory === c ? BRAND.cream : BRAND.white
                        }}
                      >
                        <button className="text-left flex-1" onClick={()=>toggleCategory(String(c))}>
                          <div className="font-medium">{String(c)}</div>
                          <div className="text-xs text-neutral-500">{c === "Classic" ? "Session + printed copies" : "Session + digital-only"}</div>
                        </button>
                        {serviceCategory && String(c)===serviceCategory && (
                          <Button size="sm" variant="outline" onClick={()=>{ setServiceCategory(""); setOpenCategory(""); setServiceGroup(""); setOpenGroup(""); setService(""); }}>Change</Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                    // Digital auto-selected for With Photographer and Seasonal Sessions
                    <div className="mb-3 p-3 border rounded-xl bg-neutral-50">
                      <p className="text-sm text-neutral-600">📱 Digital-only package (photos delivered via Lightroom)</p>
                    </div>
                  )}

                {/* Groups */}
                {serviceCategory && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Groups</div>
                    <div className="grid md:grid-cols-3 gap-3">
                      {groups.map((g)=> (
                        <button 
                          key={g} 
                          className={cn(
                            "text-left border rounded-xl p-3 hover:shadow-sm transition flex items-center gap-3",
                            serviceGroup === g && "shadow-md"
                          )}
                          style={{ 
                            borderColor: serviceGroup === g ? BRAND.forest : "#e5e5e5",
                            backgroundColor: serviceGroup === g ? BRAND.forest : BRAND.white
                          }}
                          onClick={()=>toggleGroup(g)}
                        >
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-lg">{GROUP_THUMBS[g] || "📷"}</div>
                          <div>
                            <div className="font-medium" style={{ color: serviceGroup === g ? BRAND.white : BRAND.charcoal }}>{g}</div>
                            {/* ✅ CHANGE THIS LINE */}
                            <div className="text-xs" style={{ color: serviceGroup === g ? BRAND.white : "#737373" }}>{getGroupDescription(g)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                {serviceGroup && (
                  <div className="mt-4">
                    {t === "Seasonal Sessions" && (
                      <div className="mb-3 text-sm flex items-center gap-2"><Info className="w-4 h-4"/> {CHRISTMAS_2025.title} — {CHRISTMAS_2025.desc}</div>
                    )}
                    <div className="text-sm font-medium mb-2">Services</div>
                    <div className="grid md:grid-cols-3 gap-3">
                      {services.map((s: string)=> {
                        const info = serviceInfo[s] || { details: "", price: 0 };
                        // Use classic details if Classic category is selected, otherwise use digital details
                        const displayDetails = serviceCategory === "Classic" && info.classicDetails ? info.classicDetails : info.details;
                        const displayPrice = serviceCategory === "Classic" ? info.price + 50 : info.price;
                        return (
                          <button 
                            key={s} 
                            onClick={()=> setService(s)} 
                            className={cn(
                              "text-left border rounded-xl p-3 hover:shadow-md transition",
                              service === s && "shadow-lg"
                            )}
                            style={{ 
                              borderColor: service === s ? BRAND.forest : "#e5e5e5",
                              backgroundColor: service === s ? "#e8f5f0" : BRAND.white
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold" style={{ color: BRAND.forest }}>{s}</div>
                                {displayDetails && (
                                <ul className="text-sm text-neutral-600 mt-2 space-y-1">
                                  {displayDetails.split('\n').map((line, idx) => (
                                    <li key={idx} className="flex items-start gap-1">
                                      <span className="text-green-600 mt-0.5">•</span>
                                      <span>{line}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              </div>
                              {displayPrice > 0 && (
                              <Badge style={{ backgroundColor: BRAND.forest, color: BRAND.white }}>
                                {currency(displayPrice)}
                              </Badge>
                            )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {service && (
        <div className="mt-4 border rounded-2xl p-3 bg-neutral-50">
          <div className="text-sm">Selected:</div>
          <div className="font-medium">{serviceType} • {serviceCategory} • {serviceGroup} • {service}</div>
          <div className="text-xs text-neutral-500 mt-1">Press Next to continue.</div>
        </div>
      )}
            {service && (
        <div className="mt-4 border rounded-2xl p-3 bg-neutral-50">
          <div className="text-sm">Selected:</div>
          <div className="font-medium">{serviceType} • {serviceCategory} • {serviceGroup} • {service}</div>
          <div className="text-xs text-neutral-500 mt-1">Press Next to continue.</div>
        </div>
      )}
    </div>
  );
}


function StepSchedule({ date, setDate, time, setTime, duration, availableSlots, serviceType, serviceRestrictions, bookingPolicies }:{
  date:string; setDate:(v:string)=>void; time:string; setTime:(v:string)=>void; duration:number; availableSlots:string[]; serviceType:string; serviceRestrictions: Record<string, ServiceRestriction>; bookingPolicies: { schedulingWindow: number; schedulingWindowUnit: 'days' | 'months' };
}){
  const [loading, setLoading] = useState(false);
  const [realAvailableSlots, setRealAvailableSlots] = useState<string[]>(availableSlots);
  const [usingMockData, setUsingMockData] = useState(false);
  const [availabilityCache, setAvailabilityCache] = useState<Record<string, number>>({});
  const [loadingDates, setLoadingDates] = useState(false);

  // Get today's date in YYYY-MM-DD format (Manila timezone)
  const today = useMemo(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Asia/Manila', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  }, []);

  // Auto-select today if no date is selected
  useEffect(() => {
    if (!date) {
      setDate(today);
    }
  }, [date, today, setDate]);

  // Generate calendar days based on scheduling window from settings
  const next90Days = useMemo(() => {
    const days: string[] = [];
    const start = new Date(today);
    
    // Convert scheduling window to days
    let daysToGenerate = bookingPolicies.schedulingWindow;
    if (bookingPolicies.schedulingWindowUnit === 'months') {
      daysToGenerate = bookingPolicies.schedulingWindow * 30; // Approximate 30 days per month
    }
    
    for (let i = 0; i < daysToGenerate; i++) {
      const dateObj = new Date(start);
      dateObj.setDate(start.getDate() + i);
      days.push(dateObj.toISOString().split('T')[0]);
    }
    return days;
  }, [today, bookingPolicies.schedulingWindow, bookingPolicies.schedulingWindowUnit]);

  // Current month view state
  const [currentMonth, setCurrentMonth] = useState(new Date(today));
  
  // Get calendar grid for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    const days: (string | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push(dateStr);
    }
    
    return days;
  }, [currentMonth]);

  // Pre-fetch availability for next 30 days - OPTIMIZED: Single batch request
  useEffect(() => {
    if (!duration) return;
    
    // Skip if we already have data cached
    if (Object.keys(availabilityCache).length > 0) return;
    
    setLoadingDates(true);
    
    fetch('/api/calendar/availability-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates: next90Days, duration })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const cache: Record<string, number> = {};
          data.results.forEach(({ date, count }: { date: string; count: number }) => {
            cache[date] = count;
          });
          setAvailabilityCache(cache);
          setUsingMockData(data.usingMockData || false);
        }
      })
      .catch(err => {
        console.error('Failed to load availability:', err);
      })
      .finally(() => setLoadingDates(false));
  }, [duration]);

  // Fetch slots for selected date - WITH CACHING
  useEffect(() => {
    if (!date || !duration) return;
    
    setLoading(true);
    
    // Create cache key for this specific date + duration combo
    const cacheKey = `${date}-${duration}`;
    
    // Check if we already fetched this date + duration
    const cachedSlots = sessionStorage.getItem(cacheKey);
    if (cachedSlots) {
      setRealAvailableSlots(JSON.parse(cachedSlots));
      setLoading(false);
      return;
    }
    
    fetch(`/api/calendar/availability?date=${date}&duration=${duration}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Cache the filtered slots (API already filtered past times)
          sessionStorage.setItem(cacheKey, JSON.stringify(data.availableSlots));
          setRealAvailableSlots(data.availableSlots);
          setUsingMockData(data.usingMockData || false);
        } else {
          console.error('Failed to fetch availability:', data.error);
          setRealAvailableSlots(availableSlots);
          setUsingMockData(true);
        }
      })
      .catch(err => {
        console.error('Error fetching availability:', err);
        setRealAvailableSlots(availableSlots);
        setUsingMockData(true);
      })
      .finally(() => setLoading(false));
  }, [date, duration]);

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left: Calendar */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Select date & time</h2>
        
        {/* Calendar */}
        <div className="border rounded-xl p-4 bg-white">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-neutral-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-semibold">{formatMonthYear(currentMonth)}</h3>
            <button 
              onClick={goToNextMonth}
              className="p-2 hover:bg-neutral-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, idx) => {
              if (!d) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const isDateAllowed = isDateAllowedForService(d, serviceType, serviceRestrictions);
              const availableCount = availabilityCache[d] || 0;
              const isPastDate = d < today;
              const isFullyBooked = availableCount === 0 || !isDateAllowed || isPastDate;
              const isSelected = date === d;
              const isToday = d === today;

              return (
                <button
                  key={d}
                  onClick={() => {
                    if (!isFullyBooked) {
                      setDate(d);
                      setTime('');
                    }
                  }}
                  disabled={isFullyBooked}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition relative",
                    isSelected && "bg-[#0b3d2e] text-white shadow-md",
                    !isSelected && !isFullyBooked && "hover:bg-neutral-100 text-neutral-900",
                    isFullyBooked && "text-neutral-300 cursor-not-allowed",
                    isToday && !isSelected && "border-2 border-[#0b3d2e]"
                  )}
                >
                  {d.split('-')[2]}
                  {!isFullyBooked && availableCount > 0 && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0b3d2e]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Timezone */}
          <p className="text-xs text-neutral-500 mt-4 text-center">
            Time zone: Asia/Manila
          </p>
        </div>

        <p className="text-xs text-neutral-500 mt-3">
          {usingMockData 
            ? "⚠️ Showing mock availability"
            : "✅ Real-time Google Calendar sync"}
        </p>
      </div>

      {/* Right: Time Slots */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {date ? formatDateDisplay(date) : 'Select a date'}
        </h3>

        {!date && (
          <div className="border rounded-xl p-8 bg-neutral-50 text-center text-neutral-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Please select a date to view available times</p>
          </div>
        )}

        {date && loading && (
          <div className="border rounded-xl p-8 bg-white text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0b3d2e]" />
            <p className="text-sm text-neutral-600">Loading available times...</p>
          </div>
        )}

        {date && !loading && (
          <div className="border rounded-xl bg-white overflow-hidden">
            <div className="p-3 bg-neutral-50 border-b">
              <p className="text-xs text-neutral-600">
                {duration} minute session • Manila Time
              </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
              {realAvailableSlots.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  <XCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No available times</p>
                  <p className="text-xs mt-1">
                    {date === today 
                      ? "Try selecting a future date"
                      : "Please choose another day"}
                  </p>
                </div>
              )}

              {filterSlotsByService(realAvailableSlots, serviceType, serviceRestrictions).map((s) => (
                <button
                  key={s}
                  onClick={() => setTime(s)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition border",
                    time === s && "bg-[#0b3d2e] text-white border-[#0b3d2e] shadow-sm",
                    time !== s && "bg-white text-neutral-900 border-neutral-200 hover:border-[#0b3d2e] hover:bg-neutral-50"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  {to12Hour(s)}
                </button>
              ))}
            </div>
          </div>
        )}

        {date && !loading && realAvailableSlots.length > 0 && (
          <p className="text-xs text-neutral-500 mt-3">
            {serviceRestrictions[serviceType]?.availableFrom !== undefined && 
              serviceRestrictions[serviceType]?.availableUntil !== undefined && 
              `${serviceType} sessions: ${serviceRestrictions[serviceType].availableFrom}:00 ${serviceRestrictions[serviceType].availableFrom! >= 12 ? 'PM' : 'AM'} - ${serviceRestrictions[serviceType].availableUntil! > 12 ? serviceRestrictions[serviceType].availableUntil! - 12 : serviceRestrictions[serviceType].availableUntil}:00 ${serviceRestrictions[serviceType].availableUntil! >= 12 ? 'PM' : 'AM'}`}
          </p>
        )}
      </div>
    </div>
  );
}

function StepCustomer(props: { 
  firstName: string; 
  lastName: string; 
  email: string; 
  phone: string; 
  address: string; 
  setFirst: (v: string) => void; 
  setLast: (v: string) => void; 
  setEmail: (v: string) => void; 
  setPhone: (v: string) => void; 
  setAddr: (v: string) => void;
  emailVerified: boolean;
  setEmailVerified: (v: boolean) => void;
  verificationCode: string;
  setVerificationCode: (v: string) => void;
  sentCode: string;
  setSentCode: (v: string) => void;
  setModalMessage: (v: string) => void;
  setShowSuccessModal: (v: boolean) => void;
  setShowErrorModal: (v: boolean) => void;
}) {
  const { firstName, lastName, email, phone, address, setFirst, setLast, setEmail, setPhone, setAddr, emailVerified, setEmailVerified, verificationCode, setVerificationCode, sentCode, setSentCode, setModalMessage, setShowSuccessModal, setShowErrorModal } = props;
  const [sendingCode, setSendingCode] = useState(false);
  const [emailError, setEmailError] = useState("");

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  async function sendVerificationCode() {
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setSendingCode(true);
    setEmailError("");

    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

    if (result.success) {
      setSentCode(result.code || 'SENT'); // Use 'SENT' placeholder if code not returned
      setModalMessage(`Verification code sent to ${email}! Please check your email inbox (and spam folder).`);
      setShowSuccessModal(true);
    } else {
        setEmailError(result.error || 'Failed to send verification code');
      }
    } catch {
      setEmailError('Network error. Please try again.');
    } finally {
      setSendingCode(false);
    }
  }

  function verifyCode() {
    console.log('🔍 Verifying code...');
    console.log('  Entered code:', verificationCode);
    console.log('  Expected code:', sentCode);
    console.log('  Match:', verificationCode === sentCode);
    
    if (verificationCode === sentCode) {
      console.log('✅ Setting emailVerified to TRUE');
      setEmailVerified(true);
      setModalMessage('Email verified successfully!');
      setShowSuccessModal(true);
    } else {
      console.log('❌ Codes do not match');
      setModalMessage('Invalid verification code. Please try again.');
      setShowErrorModal(true);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Your details</h2>
      <p className="text-neutral-600 mb-4">We&apos;ll send your confirmation and reminders here.</p>
      
      <div className="grid md:grid-cols-2 gap-3">
        <Input placeholder="First name *" value={firstName} onChange={(e) => setFirst(e.target.value)} />
        <Input placeholder="Last name *" value={lastName} onChange={(e) => setLast(e.target.value)} />
        
        <div className="md:col-span-2">
          <div className="flex gap-2">
            <Input 
              placeholder="Email *" 
              type="email" 
              value={email} 
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailVerified(false);
                setEmailError("");
              }}
              disabled={emailVerified}
              className={emailVerified ? "bg-green-50 border-green-600" : ""}
            />
            {!emailVerified && (
              <Button 
                onClick={sendVerificationCode} 
                disabled={!email || sendingCode}
                style={{ backgroundColor: BRAND.terracotta, color: BRAND.white }}
              >
                {sendingCode ? "Sending..." : "Verify"}
              </Button>
            )}
            {emailVerified && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-600 rounded-lg text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </div>
            )}
          </div>
          {emailError && (
            <div className="text-red-600 text-sm mt-1">{emailError}</div>
          )}
        </div>

        {sentCode && !emailVerified && (
          <div className="md:col-span-2 p-4 border-2 border-blue-600 rounded-xl bg-blue-50">
            <p className="text-sm text-blue-900 mb-2">📧 Enter the 6-digit code sent to {email}</p>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter 6-digit code" 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
              <Button 
                onClick={verifyCode}
                disabled={verificationCode.length !== 6}
                style={{ backgroundColor: BRAND.clay, color: BRAND.white }}
              >
                Confirm
              </Button>
            </div>
            <p className="text-xs text-blue-700 mt-2">Didn&apos;t receive it? <button onClick={sendVerificationCode} className="underline font-medium">Resend code</button></p>
          </div>
        )}

        <Input placeholder="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="md:col-span-2">
          <Input placeholder="Address" value={address} onChange={(e) => setAddr(e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function StepConsent(props:{
  serviceType: string;
  serviceGroup: string;
  socialConsent: "yes" | "no" | "";
  setSocialConsent: (v: "yes" | "no" | "") => void;
  eventType: string;
  setEventType: (v: string) => void;
  celebrantName: string;
  setCelebName: (v: string) => void;
  birthdayAge: string;
  setBirthdayAge: (v: string) => void;
  graduationLevel: string;
  setGradLevel: (v: string) => void;
  eventDate: string;
  setEventDate: (v: string) => void;
}){
  const { serviceType, serviceGroup, socialConsent, setSocialConsent, eventType, setEventType, celebrantName, setCelebName, birthdayAge, setBirthdayAge, graduationLevel, setGradLevel, eventDate, setEventDate } = props;
  const eventTypes = ["Birthday", "Graduation/Moving Up", "Prenup", "Wedding", "Monthsary", "Anniversary", "Maternity", "Other"];
  const gradLevels = ["Elementary", "High School", "College", "Post Graduate"];

  const isPreBirthday = serviceGroup === "Kids Pre-birthday (Girls)" || serviceGroup === "Kids Pre-birthday (Boys)";
  const isChristmas = serviceType === "Seasonal Sessions";

  // Auto-set event type to "Birthday" for pre-birthday sessions
  useEffect(() => {
    if (isPreBirthday && eventType !== "Birthday") {
      setEventType("Birthday");
    }
  }, [isPreBirthday, eventType, setEventType]);

  return (
    <div>
      <h2 className="text-xl font-semibold">Social & event information</h2>
      <p className="text-neutral-600 mb-4">Let us know if we can share your special moments.</p>
      
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">
          Is it OK for us to greet you on your milestone or post about your photos on our social media accounts? <span className="text-red-500">*</span>
        </label>
        <Select value={socialConsent} onValueChange={(v) => setSocialConsent(v as "yes" | "no")}>
          <SelectTrigger>
            <SelectValue placeholder="Please select Yes or No" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pre-birthday: Always ask name & age, and if YES to consent, also ask for birthday date */}
      {isPreBirthday && (
        <div className="mt-4 grid md:grid-cols-2 gap-3 p-4 border rounded-xl bg-neutral-50">
          <div className="md:col-span-2">
            <p className="text-sm text-neutral-600 mb-3">Please tell us about the birthday celebrant:</p>
          </div>
          <Input 
            placeholder="Celebrant's name *" 
            value={celebrantName} 
            onChange={(e) => setCelebName(e.target.value)} 
          />
          <Input 
            placeholder="Age *" 
            value={birthdayAge} 
            onChange={(e) => setBirthdayAge(e.target.value)} 
          />
          
          {/* If YES to consent, also ask for birthday date */}
          {socialConsent === "yes" && (
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-600 mb-1 block">Birthday date *</label>
              <Input 
                type="date"
                value={eventDate} 
                onChange={(e) => setEventDate(e.target.value)} 
              />
              <p className="text-xs text-neutral-500 mt-1">We'll use this date to greet the celebrant on social media</p>
            </div>
          )}
        </div>
      )}
      {/* Christmas: If yes to consent, ask for celebrant name only */}
      {isChristmas && socialConsent === "yes" && (
        <div className="mt-4 p-4 border rounded-xl bg-neutral-50">
          <p className="text-sm text-neutral-600 mb-3">🎄 This is a Christmas session. Please provide the name we should use for greetings:</p>
          <Input 
            placeholder="Name for greetings *" 
            value={celebrantName} 
            onChange={(e) => setCelebName(e.target.value)} 
          />
        </div>
      )}

      {/* All other cases: Full event questions if consent is yes */}
      {!isPreBirthday && !isChristmas && socialConsent === "yes" && (
        <div className="mt-4 grid md:grid-cols-2 gap-3 p-4 border rounded-xl bg-neutral-50">
          <div className="md:col-span-2">
            <p className="text-sm text-neutral-600 mb-3">Great! Please tell us more about your event:</p>
          </div>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger>
              <SelectValue placeholder="Event or milestone *" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((t) => (
                <SelectItem value={t} key={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input 
            placeholder="Celebrant's name *" 
            value={celebrantName} 
            onChange={(e) => setCelebName(e.target.value)} 
          />
          
          {/* Birthday-specific fields */}
          {eventType === "Birthday" && (
            <>
              <div>
                <label className="text-xs text-neutral-600 mb-1 block">Age *</label>
                <Input 
                  placeholder="Enter age" 
                  value={birthdayAge} 
                  onChange={(e) => setBirthdayAge(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600 mb-1 block">Birthday date *</label>
                <Input 
                  type="date"
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)} 
                />
              </div>
            </>
          )}
          
          {/* Graduation-specific fields */}
          {eventType === "Graduation/Moving Up" && (
            <>
              <div>
                <label className="text-xs text-neutral-600 mb-1 block">Graduation level *</label>
                <Select value={graduationLevel} onValueChange={setGradLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradLevels.map((t) => (
                      <SelectItem value={t} key={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-neutral-600 mb-1 block">Graduation date *</label>
                <Input 
                  type="date"
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)} 
                />
              </div>
            </>
          )}
          
          {/* Prenup date */}
          {eventType === "Prenup" && (
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-600 mb-1 block">Wedding date *</label>
              <Input 
                type="date"
                value={eventDate} 
                onChange={(e) => setEventDate(e.target.value)} 
              />
            </div>
          )}
          
          {/* Wedding date */}
          {eventType === "Wedding" && (
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-600 mb-1 block">Wedding date *</label>
              <Input 
                type="date"
                value={eventDate} 
                onChange={(e) => setEventDate(e.target.value)} 
              />
            </div>
          )}
          
          {/* Monthsary date */}
          {eventType === "Monthsary" && (
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-600 mb-1 block">Monthsary date *</label>
              <Input 
                type="date"
                value={eventDate} 
                onChange={(e) => setEventDate(e.target.value)} 
              />
            </div>
          )}
          
          {/* Anniversary date */}
          {eventType === "Anniversary" && (
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-600 mb-1 block">Anniversary date *</label>
              <Input 
                type="date"
                value={eventDate} 
                onChange={(e) => setEventDate(e.target.value)} 
              />
            </div>
          )}
          
          {/* Maternity date */}
          {eventType === "Maternity" && (
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-600 mb-1 block">Expected due date *</label>
              <Input 
                type="date"
                value={eventDate} 
                onChange={(e) => setEventDate(e.target.value)} 
              />
            </div>
          )}
          
          {/* Other - generic date */}
          {eventType === "Other" && (
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-600 mb-1 block">Event date *</label>
              <Input 
                type="date"
                value={eventDate} 
                onChange={(e) => setEventDate(e.target.value)} 
              />
            </div>
          )}
        </div>
      )}

      {/* If no consent: Different handling for Self-Shoot vs With Photographer */}
      {socialConsent === "no" && !isPreBirthday && !isChristmas && (
        <div className="mt-4 p-4 border rounded-xl bg-neutral-50">
          <p className="text-sm text-neutral-600 mb-3">No problem! We respect your privacy and won&apos;t share your photos publicly.</p>
          
          {serviceType === "Self-Shoot" ? (
            <p className="text-sm text-neutral-600">You can proceed to select your backdrops in the next step.</p>
          ) : (
            <>
              <p className="text-sm text-neutral-600 mb-3">To help us prepare, please provide basic information:</p>
              
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Event or milestone *" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((t) => (
                      <SelectItem value={t} key={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  placeholder="Celebrant's name *" 
                  value={celebrantName} 
                  onChange={(e) => setCelebName(e.target.value)} 
                />
                
                {/* Birthday: only ask for age, NOT date */}
                {eventType === "Birthday" && (
                  <div>
                    <label className="text-xs text-neutral-600 mb-1 block">Age *</label>
                    <Input 
                      placeholder="Enter age" 
                      value={birthdayAge} 
                      onChange={(e) => setBirthdayAge(e.target.value)} 
                    />
                  </div>
                )}
                
                {/* Graduation: only ask for level, NOT date */}
                {eventType === "Graduation/Moving Up" && (
                  <div>
                    <label className="text-xs text-neutral-600 mb-1 block">Graduation level *</label>
                    <Select value={graduationLevel} onValueChange={setGradLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradLevels.map((t) => (
                          <SelectItem value={t} key={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StepBackdrops({ enabled, duration, limit, selected, onToggle, move, allocations, setAlloc }:{ enabled:boolean; duration:number; limit:number; selected:string[]; onToggle:(k:string)=>void; move:(idx:number,dir:number)=>void; allocations:Record<string, number>; setAlloc:(k:string,v:string)=>void; }){
  if(!enabled){
    return (<div className="text-sm text-neutral-600 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Backdrop selection applies to <span className="font-medium">Self‑Shoot</span> and <span className="font-medium">Adult/Family With Photographer</span> sessions only.</div>);
  }
  const total = Object.values(allocations).reduce((a,b)=>a+(Number(b)||0),0);
  return (
    <div>
      <h2 className="text-xl font-semibold">Choose backdrops & allocate time</h2>
      <p className="text-neutral-600">For {duration}‑minute sessions, you can select up to <span className="font-medium">{limit}</span> backdrops. Please allocate minutes that sum to <span className="font-medium">{duration}</span>.</p>
      <div className="grid md:grid-cols-3 gap-3 mt-3">
        {BACKDROPS.map((bd)=> {
          const isSelected = selected.includes(bd.key);
          const canAdd = selected.length < limit;
          const isDisabled = !isSelected && !canAdd;
          
          return (
            <button 
              key={bd.key} 
              onClick={()=>onToggle(bd.key)} 
              disabled={isDisabled}
              className={cn(
                "border rounded-2xl p-3 text-left shadow-sm transition relative",
                isSelected ? "border-green-600 bg-green-50" : "border-neutral-200 hover:shadow-md",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Selected checkmark badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl" style={{background: bd.swatch}}/>
                <div>
                  <div className="font-medium">{bd.name}</div>
                  <div className="text-xs text-neutral-500">
                    {isSelected 
                      ? "✓ Selected • Tap to remove" 
                      : isDisabled 
                        ? `Max ${limit} backdrops` 
                        : "Tap to add"
                    }
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {selected.length>0 && (
        <div className="mt-4">
          {/* NEW INFO BOX */}
            <div className="mb-3 p-3 border-2 rounded-xl" style={{ borderColor: BRAND.terracotta, backgroundColor: `${BRAND.terracotta}15` }}>
              <div className="flex items-center gap-2" style={{ color: BRAND.terracotta }}>
                <Info className="w-5 h-5" />
                <span className="font-medium">Arrange backdrops in your preferred shooting order (1st → 2nd → 3rd...)</span>
              </div>
              <p className="text-xs mt-1 ml-7" style={{ color: BRAND.clay }}>Use ↑ ↓ buttons to reorder. First backdrop will be shot first, last will be shot last.</p>
            </div>
          
          <h3 className="font-medium mb-2">Order & time allocation</h3>
          <div className="space-y-2">
            {selected.map((key,idx)=>{
              const bd = BACKDROPS.find(b=>b.key===key);
              const orderLabel = idx === 0 ? "1st" : idx === 1 ? "2nd" : idx === 2 ? "3rd" : `${idx+1}th`;
              return (
                <div key={key} className="border rounded-xl p-3 flex items-center gap-3">
                  {/* NEW ORDER BADGE */}
                  <div className="w-10 h-10 rounded-lg font-bold flex items-center justify-center text-sm" style={{ backgroundColor: BRAND.clay, color: BRAND.white }}>
                    {orderLabel}
                  </div>
                  
                  <div className="w-8 h-8 rounded-lg" style={{background: bd?.swatch}}/>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{bd?.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Button variant="outline" size="sm" onClick={()=>move(idx,-1)} disabled={idx===0}>↑</Button>
                      <Button variant="outline" size="sm" onClick={()=>move(idx,1)} disabled={idx===selected.length-1}>↓</Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={()=>onToggle(key)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        Remove
                      </Button>
                      {/* REMOVED: First to last = shooting order text */}
                    </div>
                  </div>
                  <div className="w-40">
                    <Input type="number" min={0} step={5} placeholder="minutes" value={allocations[key]||""} onChange={(e)=>setAlloc(key, e.target.value)}/>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2 text-sm">
            <div className={cn("flex items-center gap-1", total===duration?"text-green-700":"text-red-600") }>
              {total===duration ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
              Allocation total: {total} / {duration} minutes
            </div>
            <div className="text-neutral-500">Max backdrops: {limit}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepAddons({ addons, toggle }:{ addons:Record<string, number>; toggle:(id:string,delta:number)=>void; }){
  return (
    <div>
      <h2 className="text-xl font-semibold">Optional add‑ons</h2>
      <p className="text-neutral-600 mb-3">Enhance your session with prints.</p>
      <div className="space-y-3">
        {ADDONS.map(a=>{ const qty=addons[a.id]||0; return (
          <div key={a.id} className="border rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{a.label}</div>
              <div className="text-sm text-neutral-500">{currency(a.price)} each set</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={()=>toggle(a.id,-1)}>-</Button>
              <div className="w-10 text-center">{qty}</div>
              <Button variant="outline" size="sm" onClick={()=>toggle(a.id,+1)}>+</Button>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function StepVideoAndTerms({ 
  acceptedPhotoDelivery, setAcceptedPhotoDelivery,
  acceptedLocation, setAcceptedLocation,
  acceptedParking, setAcceptedParking,
  acceptedBookingPolicy, setAcceptedBookingPolicy
}:{ 
  acceptedPhotoDelivery: boolean; setAcceptedPhotoDelivery: (v:boolean)=>void;
  acceptedLocation: boolean; setAcceptedLocation: (v:boolean)=>void;
  acceptedParking: boolean; setAcceptedParking: (v:boolean)=>void;
  acceptedBookingPolicy: boolean; setAcceptedBookingPolicy: (v:boolean)=>void;
}){
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Terms & Conditions</h2>
        <p className="text-neutral-600">Please read and agree to each term individually to proceed.</p>
      </div>

      {/* Term 1: Photo Delivery via Adobe Lightroom */}
      <div className="border rounded-2xl p-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-blue-600"/>
          <span className="font-semibold text-base">Photo Delivery Method</span>
        </div>
        <div className="space-y-2 text-sm text-neutral-700 mb-4">
          <p className="font-medium">English:</p>
          <p>Your photos will be delivered <strong>only via Adobe Lightroom</strong>. By agreeing, you understand that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>We do not send photos through any other platform</strong> such as Google Drive, Dropbox, or Messenger</li>
            <li>You need to have an <strong>Adobe Lightroom account</strong> (free to create)</li>
            <li>If accessing via mobile or tablet, you need to download the <strong>Lightroom Mobile App</strong></li>
          </ul>
          <p className="font-medium mt-3">Filipino:</p>
          <p>Ang inyong mga larawan ay <strong>ihahatid lamang sa pamamagitan ng Adobe Lightroom</strong>. Sa pagsang-ayon, nauunawaan ninyo na:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Hindi kami nagpapadala ng larawan sa ibang platform</strong> tulad ng Google Drive, Dropbox, o Messenger</li>
            <li>Kailangan ninyong gumawa ng <strong>Adobe Lightroom account</strong> (libre lang po)</li>
            <li>Kung gagamitin sa cellphone o tablet, kailangan i-download ang <strong>Lightroom Mobile App</strong></li>
          </ul>
        </div>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <Checkbox 
            checked={acceptedPhotoDelivery} 
            onCheckedChange={(v)=>setAcceptedPhotoDelivery(Boolean(v))}
            className="mt-1"
          />
          <span className="flex-1">
            <strong>I agree</strong> to receive my photos only via Adobe Lightroom and will create an account/download the app as needed.
            <br/>
            <span className="text-neutral-600">
              <strong>Sumasang-ayon ako</strong> na tatanggapin ang aking mga larawan lamang sa Adobe Lightroom at gagawa ng account/mag-download ng app kung kinakailangan.
            </span>
          </span>
        </label>
      </div>

      {/* Term 2: Studio Location & Arrival Time */}
      <div className="border rounded-2xl p-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-green-600"/>
          <span className="font-semibold text-base">Studio Location & Arrival Guidelines</span>
        </div>
        <div className="space-y-2 text-sm text-neutral-700 mb-4">
          <p className="font-medium">English:</p>
          <p><strong>Studio Address:</strong> Located inside <strong>Green Valley Field Subdivision</strong>, between Lintiw Road and Indang Central Elementary School. Directions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Enter the subdivision, go straight to the dead end, then turn right</li>
            <li>We're the <strong>fourth gate on the left</strong>, with a <strong>Memories Photography Studio tarpaulin</strong> near the gate</li>
            <li>Our studio is at the back of the property — the <strong>dark gray and blue painted house</strong>, not the house at the front</li>
            <li><a href="https://maps.app.goo.gl/kcjjzkZnvvpxJmQL9" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View on Google Maps</a></li>
          </ul>
          <p className="mt-2"><strong>Respect the Neighborhood:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Please be courteous to the residents in front of the property</li>
            <li>Avoid being noisy, nosy, or disruptive while waiting or shooting</li>
          </ul>
          <p className="mt-2"><strong>Arrival Time:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Arrive <strong>at least 5 minutes before</strong> your scheduled time</li>
            <li>Late arrivals will have the lost time deducted from their session</li>
            <li>We provide 5 minutes of extra time for outfit or backdrop changes</li>
            <li>Our timer starts at your session time plus 5 minutes (for setup and backdrop transitions)</li>
            <li>Timers are set per backdrop</li>
            <li>Timer stoppage or pauses are solely under the studio's discretion</li>
          </ul>
          <p className="font-medium mt-3">Filipino:</p>
          <p><strong>Address ng Studio:</strong> Matatagpuan sa loob ng <strong>Green Valley Field Subdivision</strong>, sa pagitan ng Lintiw Road at Indang Central Elementary School. Direksyon:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pumasok sa subdivision, diretso hanggang dulo, pagkatapos kumanan</li>
            <li>Kami ang <strong>ikaapat na gate sa kaliwa</strong>, may <strong>Memories Photography Studio tarpaulin</strong> malapit sa gate</li>
            <li>Ang aming studio ay nasa likod ng property — ang <strong>kulay dark gray at asul na pintadong bahay</strong>, hindi ang bahay sa harap</li>
            <li><a href="https://maps.app.goo.gl/kcjjzkZnvvpxJmQL9" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Tingnan sa Google Maps</a></li>
          </ul>
          <p className="mt-2"><strong>Igalang ang Kapitbahayan:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pakiusap na maging magalang sa mga nakatira sa harap ng property</li>
            <li>Iwasan ang pagmamaingay, pagkausisa, o pag-abala habang naghihintay o nag-shoot</li>
          </ul>
          <p className="mt-2"><strong>Oras ng Pagdating:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dumating nang <strong>hindi bababa sa 5 minuto bago</strong> ang inyong schedule</li>
            <li>Ang mga late arrival ay babawasan ng oras na nawala sa kanilang session</li>
            <li>Nagbibigay kami ng 5 minuto extra para sa outfit o backdrop changes</li>
            <li>Ang aming timer ay nagsisimula sa inyong session time plus 5 minuto (para sa setup at backdrop transitions)</li>
            <li>Ang timers ay naka-set bawat backdrop</li>
            <li>Ang pagtigil o pag-pause ng timer ay nasa discretion lamang ng studio</li>
          </ul>
        </div>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <Checkbox 
            checked={acceptedLocation} 
            onCheckedChange={(v)=>setAcceptedLocation(Boolean(v))}
            className="mt-1"
          />
          <span className="flex-1">
            <strong>I agree</strong> and confirm that I know the studio location, will be respectful to neighbors, and will arrive on time.
            <br/>
            <span className="text-neutral-600">
              <strong>Sumasang-ayon ako</strong> at kinukumpirma na alam ko ang lokasyon ng studio, igagalang ko ang kapitbahayan, at darating ako sa tamang oras.
            </span>
          </span>
        </label>
      </div>

      {/* Term 3: Parking Guidelines */}
      <div className="border rounded-2xl p-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-orange-600"/>
          <span className="font-semibold text-base">Parking Guidelines</span>
        </div>
        <div className="space-y-2 text-sm text-neutral-700 mb-4">
          <p className="font-medium">English:</p>
          <p>By agreeing, you understand and commit to our parking policy:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Park <strong>under the rambutan tree</strong> (designated parking area), <strong>OR</strong></li>
            <li>On the <strong>vacant corner lot to the left</strong></li>
            <li><strong>DO NOT block the gate or driveway at any time</strong></li>
          </ul>
          <p className="font-medium mt-3">Filipino:</p>
          <p>Sa pagsang-ayon, nauunawaan at nangagako kayong sumunod sa aming parking policy:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mag-park <strong>sa ilalim ng puno ng rambutan</strong> (itinalagang parking area), <strong>O KAYA</strong></li>
            <li>Sa <strong>bakanteng corner lot sa kaliwa</strong></li>
            <li><strong>HUWAG haharangan ang gate o driveway anumang oras</strong></li>
          </ul>
        </div>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <Checkbox 
            checked={acceptedParking} 
            onCheckedChange={(v)=>setAcceptedParking(Boolean(v))}
            className="mt-1"
          />
          <span className="flex-1">
            <strong>I agree</strong> to follow the parking guidelines and will not block the gate or driveway.
            <br/>
            <span className="text-neutral-600">
              <strong>Sumasang-ayon ako</strong> na susundin ang parking guidelines at hindi haharangan ang gate o driveway.
            </span>
          </span>
        </label>
      </div>

      {/* Term 4: Booking Policy & Tardy Penalties */}
      <div className="border rounded-2xl p-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-red-600"/>
          <span className="font-semibold text-base">Booking Policy & Tardy Penalties</span>
        </div>
        <div className="space-y-3 text-sm text-neutral-700 mb-4">
          <div>
            <p className="font-medium">English:</p>
            <p><strong>Tardy Penalties:</strong></p>
          </div>
          
          <div className="pl-4 space-y-2">
            <p className="font-semibold text-red-600">🕒 Sessions 30 Minutes and Below:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>5-minute grace period for lateness</li>
              <li>More than 5 minutes late: Session time reduced by the number of minutes late + Limited to only 1 backdrop</li>
              <li>10 minutes or more late: <strong>Booking will be cancelled</strong></li>
            </ul>
            
            <p className="font-semibold text-red-600">🕓 1-Hour Sessions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>5–20 minutes late: Time reduced by the number of minutes late + Limited to 2 backdrops of choice</li>
              <li>30 minutes late or more: <strong>Booking will be cancelled</strong></li>
            </ul>
            
            <p className="font-semibold text-red-600">📷 With Photographer / Occasional Sessions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>10-minute grace period</li>
              <li>10–25 minutes late: Time reduced by the number of minutes late</li>
              <li>25 minutes or more late: <strong>Booking will be cancelled</strong></li>
            </ul>
          </div>
          
          <div>
            <p><strong>Reschedule & Cancellation Policy:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Reschedule or cancel at least <strong>2 hours before</strong> your session with a valid reason</li>
              <li><strong>Maximum of 2 reschedules</strong> per booking</li>
              <li>Late cancellations or no-shows may result in a ban from future bookings</li>
            </ul>
          </div>
          
          <div className="mt-3">
            <p className="font-medium">Filipino:</p>
            <p><strong>Mga Parusa sa Pagka-late:</strong></p>
          </div>
          
          <div className="pl-4 space-y-2">
            <p className="font-semibold text-red-600">🕒 Mga Session na 30 Minuto at Mas Mababa:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>5-minute grace period para sa pagka-late</li>
              <li>Higit sa 5 minuto ang late: Babawasan ang session time ng bilang ng minutong late + Limitado lamang sa 1 backdrop</li>
              <li>10 minuto o higit pang late: <strong>Makakansela ang booking</strong></li>
            </ul>
            
            <p className="font-semibold text-red-600">🕓 1-Oras na mga Session:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>5–20 minuto ang late: Babawasan ng oras ang bilang ng minutong late + Limitado sa 2 backdrops na pipiliin</li>
              <li>30 minuto o higit pang late: <strong>Makakansela ang booking</strong></li>
            </ul>
            
            <p className="font-semibold text-red-600">📷 With Photographer / Occasional Sessions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>10-minute grace period</li>
              <li>10–25 minuto ang late: Babawasan ng oras ang bilang ng minutong late</li>
              <li>25 minuto o higit pang late: <strong>Makakansela ang booking</strong></li>
            </ul>
          </div>
          
          <div>
            <p><strong>Reschedule & Cancellation Policy:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mag-reschedule o mag-cancel nang <strong>hindi bababa sa 2 oras bago</strong> ang inyong session na may valid na dahilan</li>
              <li><strong>Maximum na 2 reschedules</strong> bawat booking</li>
              <li>Ang late cancellations o no-shows ay maaaring magresulta sa pag-ban mula sa mga susunod na booking</li>
            </ul>
          </div>
        </div>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <Checkbox 
            checked={acceptedBookingPolicy} 
            onCheckedChange={(v)=>setAcceptedBookingPolicy(Boolean(v))}
            className="mt-1"
          />
          <span className="flex-1">
            <strong>I agree</strong> to the booking policy, tardy penalties, and understand the reschedule/cancellation terms.
            <br/>
            <span className="text-neutral-600">
              <strong>Sumasang-ayon ako</strong> sa booking policy, mga parusa sa pagka-late, at nauunawaan ko ang mga patakaran sa pag-reschedule/cancellation.
            </span>
          </span>
        </label>
      </div>

      {/* All Terms Summary */}
      <div className="border-2 border-neutral-300 rounded-2xl p-4 bg-neutral-50">
        <p className="text-sm text-center">
          {acceptedPhotoDelivery && acceptedLocation && acceptedParking && acceptedBookingPolicy ? (
            <span className="text-green-600 font-semibold">✓ All terms accepted. You may proceed to review your booking.</span>
          ) : (
            <span className="text-neutral-600">Please agree to all terms above to continue.</span>
          )}
        </p>
      </div>
    </div>
  );
}

function StepReview({ data }:{ data: {
  serviceType: string;
  serviceCategory: string;
  serviceGroup: string;
  service: string;
  duration: number;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  socialConsent: string;
  eventType: string;
  celebrantName: string;
  birthdayAge: string;
  graduationLevel: string;
  eventDate: string;
  selectedBackdrops: string[];
  allocations: Record<string, number>;
  addons: Record<string, number>;
  sessionPrice: number;
  addonsTotal: number;
  grandTotal: number;
}}){
  const session = SERVICE_INFO[data.service] || { price: 0, details: "" };
  const displayDetails = data.serviceCategory === "Classic" && session.classicDetails ? session.classicDetails : session.details;
  return (
    <div>
      <h2 className="text-xl font-semibold">Review your booking</h2>
      <div className="grid md:grid-cols-2 gap-4 mt-3">
        <div className="border rounded-2xl p-3">
          <h3 className="font-medium mb-2">Session</h3>
          <Line label="Type" value={data.serviceType}/>
          <Line label="Category" value={data.serviceCategory}/>
          <Line label="Group" value={data.serviceGroup}/>
          <Line label="Service" value={data.service}/>
          {displayDetails && <Line label="Inclusions" value={displayDetails}/>}       
          <Line label="Duration" value={`${data.duration} minutes`}/>
          <Line label="Session Price" value={currency(session.price)}/>
          <Separator className="my-2"/>
          <Line label="Date" value={data.date}/>
          <Line label="Time" value={to12Hour(data.time)}/>
        </div>
        <div className="border rounded-2xl p-3">
          <h3 className="font-medium mb-2">Customer</h3>
          <Line label="Name" value={`${data.firstName} ${data.lastName}`}/>
          <Line label="Email" value={data.email}/>
          <Line label="Phone" value={data.phone}/>
          {data.address && <Line label="Address" value={data.address}/>}
          <Separator className="my-2"/>
          {data.serviceType === "Seasonal Sessions" ? (
            <Line label="Event" value="Christmas Session" />
          ) : (
            <>
              {(data.serviceGroup === "Kids Pre-birthday (Girls)" || data.serviceGroup === "Kids Pre-birthday (Boys)") ? (
                <>
                  <Line label="Celebrant" value={data.celebrantName}/>
                  <Line label="Age" value={data.birthdayAge}/>
                </>
              ) : (
                <>
                  <Line label="Social Media Consent" value={data.socialConsent === "yes" ? "Yes" : "No"} />
                  {data.socialConsent === "yes" && (<>
                    <Line label="Event" value={data.eventType}/>
                    <Line label="Celebrant" value={data.celebrantName}/>
                    {data.eventType === "Birthday" && (
                      <>
                        <Line label="Age" value={data.birthdayAge}/>
                        <Line label="Birthday" value={data.eventDate}/>
                      </>
                    )}
                    {data.eventType === "Graduation/Moving Up" && (
                      <>
                        <Line label="Level" value={data.graduationLevel}/>
                        <Line label="Graduation Date" value={data.eventDate}/>
                      </>
                    )}
                    {data.eventType === "Prenup" && <Line label="Wedding Date" value={data.eventDate}/>}
                    {data.eventType === "Wedding" && <Line label="Wedding Date" value={data.eventDate}/>}
                    {data.eventType === "Monthsary" && <Line label="Monthsary Date" value={data.eventDate}/>}
                    {data.eventType === "Anniversary" && <Line label="Anniversary Date" value={data.eventDate}/>}
                    {data.eventType === "Maternity" && <Line label="Due Date" value={data.eventDate}/>}
                    {data.eventType === "Other" && <Line label="Event Date" value={data.eventDate}/>}
                  </>)}
                </>
              )}
            </>
          )}
        </div>
        {data.serviceType === "Self-Shoot" && (
          <div className="border rounded-2xl p-3 md:col-span-2">
            <h3 className="font-medium mb-2">Backdrops & allocation</h3>
            {data.selectedBackdrops.length===0 ? (<div className="text-sm text-neutral-500">No backdrops selected.</div>) : (
              <div className="space-y-2">
                {data.selectedBackdrops.map((key:string,idx:number)=>{ const bd=BACKDROPS.find(b=>b.key===key); return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded" style={{background: bd?.swatch}}/>
                    <div className="text-sm">{idx+1}. {bd?.name} — {data.allocations[key]} mins</div>
                  </div>
                );})}
              </div>
            )}
          </div>
        )}
        <div className="border rounded-2xl p-3 md:col-span-2">
          <h3 className="font-medium mb-2">Totals</h3>
          <Line label="Session" value={currency(data.sessionPrice||0)}/>
          <Line label="Add‑ons" value={currency(data.addonsTotal||0)}/>
          <Separator className="my-2"/>
          <Line label="Grand Total" value={currency(data.grandTotal||0)}/>
          <p className="text-xs text-neutral-500 mt-2">Final pricing may vary based on your chosen package.</p>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }:{ label:string; value:string }){
  return (
    <div className="text-sm flex items-center justify-between py-1"><span className="text-neutral-500">{label}</span><span className="font-medium max-w-[60%] text-right">{value}</span></div>
  );
}

function Confirmation(){
  return (
    <div className="text-center py-12">
      <CheckCircle2 className="w-12 h-12 mx-auto"/>
      <h2 className="text-2xl font-semibold mt-3">You’re booked!</h2>
      <p className="text-neutral-600 mt-1">A confirmation email will be sent shortly. We’re excited to see you in the studio!</p>
    </div>
  );
}

// Tiny CSS animation helper (scoped-in)
if (typeof document !== "undefined") {
  const styles = document.createElement("style");
  styles.innerHTML = `.animate-accordion{animation:acc 160ms ease-out both}@keyframes acc{from{opacity:.0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(styles);
}
