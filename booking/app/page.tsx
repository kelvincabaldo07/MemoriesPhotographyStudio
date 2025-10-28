"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { twMerge as cn } from "tailwind-merge";
import {
  ChevronRight,
  ChevronLeft,
  Info,
  CheckCircle2,
  Clock,
  XCircle,
  Image as ImageIcon,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
const STUDIO_TZ = "Asia/Manila"; // informative only in this demo
const SHOP_HOURS = { open: 9, close: 19 }; // 9:00–19:00
const SLOT_MINUTES = 15; // 15-minute increments
const BUFFER_MINUTES = 30; // 30-min buffer between sessions

// Studio brand colors - earthy, natural palette
const BRAND = {
  charcoal: "#2C2C2C",
  cream: "#FAF3E0",
  white: "#FFFFFF",
  terracotta: "#A62F20",
  clay: "#8B5E3C",
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
        "Pastel Daisies",
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
      "Adult/Family Shoot": ["Adult’s Pre-Birthday", "Maternity Photoshoot", "Family Portraits"],
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
    details: "1–2 pax • UNLIMITED shots for 15 minutes • 2 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 250,
    classicDetails: "1–2 pax • UNLIMITED shots for 15 minutes • 2 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours) • Printed Copies (1 4R (4x6) and 2 photostrips) • 5 mins photo selection (Select up to 7 photos)"
  },
  "Solo/Duo 30": { 
    details: "1–2 pax • UNLIMITED shots for 30 minutes • 2 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 400,
    classicDetails: "1–2 pax • UNLIMITED shots for 30 minutes • 2 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours) • Printed Copies (1 4R (4x6) and 2 photostrips) • 5 mins photo selection (Select up to 7 photos)"
  },
  "Solo/Duo 60": { 
    details: "1–2 pax • UNLIMITED shots for 60 minutes • 4 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 700,
    classicDetails: "1–2 pax • UNLIMITED shots for 60 minutes • 4 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours) • Printed Copies (1 4R (4x6) and 4 Wallet Size (2x3) or 2 photostrips) • 10 mins photo selection (Select up to 7 photos)"
  },

  "Small Group 15": { 
    details: "3–5 pax • UNLIMITED shots for 15 minutes • 2 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 350,
    classicDetails: "3–5 pax • UNLIMITED shots for 15 minutes • 2 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours) • Printed Copies (1 4R (4x6) and 2 photostrips) • 5 mins photo selection (Select up to 7 photos)"
  },
  "Small Group 30": { 
    details: "3–5 pax • UNLIMITED shots for 30 minutes • 2 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 600,
    classicDetails: "3–5 pax • UNLIMITED shots for 30 minutes • 2 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours) • Printed Copies (1 4R (4x6) and 2 photostrips) • 5 mins photo selection (Select up to 7 photos)"
  },
  "Small Group 60": { 
    details: "3–5 pax • UNLIMITED shots for 60 minutes • 4 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 1000,
    classicDetails: "3–5 pax • UNLIMITED shots for 60 minutes • 4 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours) • Printed Copies (1 4R (4x6) and 4 Wallet Size (2x3) or 2 photostrips) • 10 mins photo selection (Select up to 7 photos)"
  },

  "Big Group 30": { 
    details: "6–15 pax • UNLIMITED shots for 30 minutes • 2 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 800,
    classicDetails: "6–15 pax • UNLIMITED shots for 30 minutes • 2 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours) • Printed Copies (1 4R (4x6) and 2 photostrips) • 5 mins photo selection (Select up to 7 photos)"
  },
  "Big Group 60": { 
    details: "6–15 pax • UNLIMITED shots for 60 minutes • 4 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)", 
    price: 1500,
    classicDetails: "6–15 pax • UNLIMITED shots for 60 minutes • 4 backdrops of choice • ALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours) • Printed Copies (1 4R (4x6) and 4 Wallet Size (2x3) or 2 photostrips) • 10 mins photo selection (Select up to 7 photos)"
  },
  // With photographer (45 min)
  "Adult’s Pre-Birthday": { details: "45 minutes • WITH photographer • FREE family portraits • FREE number balloons • ALL ENHANCED photos", price: 1000 },
  "Family Portraits": { details: "3–8 pax • 45 minutes • WITH photographer • FREE use of all backdrops & props • ALL ENHANCED photos", price: 1000 },
  "Maternity Photoshoot": { details: "45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  // Kids themes (45 min, with photographer)
  "Racing Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Safari Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Outer Space Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Hot Air Balloon Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Cuddly Bear Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Under the Sea Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Train Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Navy Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Dreamy Rainbow Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Bloom & Blush Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Rainbow Boho Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Pastel Daisies": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Butterfly Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },
  "Mermaid Theme": { details: "Kids 0–7 • 45 minutes • WITH photographer • FREE family portraits • ALL ENHANCED photos", price: 1000 },

  // Seasonal Christmas
  "2025 Christmas – White & Gold (Solo/Duo)": { details: "1–2 pax • 45 minutes • Edited photos via private Lightroom album • Cozy white & gold set", price: 1000 },
  "2025 Christmas – White & Gold (Small Group)": { details: "3–5 pax • 45 minutes • Edited photos via private Lightroom album • Cozy white & gold set", price: 2000 },
  "2025 Christmas – White & Gold (Big Group)": { details: "6–8 pax • 45 minutes • Edited photos via private Lightroom album • Cozy white & gold set", price: 2500 },
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
  { id: "4r", label: "Printed 1 copy of 4R photo", price: 30 },
  { id: "photostrip", label: "Printed 2 photo strips", price: 30 },
  { id: "wallet", label: "Printed 4 wallet size photos", price: 30 },
  { id: "premium4r", label: "Premium Printed 1 copy of 4R photo (Canon Selphy CP1500)", price: 50 },
];

// Demo bookings
const EXISTING_BOOKINGS = [
  { date: offsetDate(0), start: "10:00", duration: 30 },
  { date: offsetDate(0), start: "13:30", duration: 60 },
  { date: offsetDate(1), start: "11:15", duration: 45 },
];

function offsetDate(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------- Utils ----------
function pad(n: number) { return n.toString().padStart(2, "0"); }
function toMinutes(hhmm: string) { const [h,m] = hhmm.split(":").map(Number); return h*60+m; }
function toHHMM(mins: number) { const h = Math.floor(mins/60), m = mins%60; return `${pad(h)}:${pad(m)}`; }
function range(start: number, end: number, step: number){ const out:number[]=[]; for(let x=start;x<=end;x+=step) out.push(x); return out; }
function generateDailySlots(){ const start=SHOP_HOURS.open*60, end=SHOP_HOURS.close*60; return range(start, end-SLOT_MINUTES, SLOT_MINUTES).map(toHHMM); }
function buildBlockedMap(date: string, existing: {date:string; start:string; duration:number}[], bufferMins=BUFFER_MINUTES){
  const blocks:[number,number][]=[];
  for(const b of existing.filter(x=>x.date===date)){
    const s=toMinutes(b.start)-bufferMins; const e=toMinutes(b.start)+b.duration+bufferMins;
    blocks.push([Math.max(s, SHOP_HOURS.open*60), Math.min(e, SHOP_HOURS.close*60)]);
  }
  return blocks;
}
// ✅ FIXED syntax here
function isSlotAvailable(slotHHMM: string, duration: number, blocked:[number,number][]): boolean {
  const s=toMinutes(slotHHMM), e=s+duration; 
  return blocked.every(([bs,be])=> e<=bs || s>=be); 
}
function inferDuration(serviceLabel?: string){ if(!serviceLabel) return 30; if(/(15)/i.test(serviceLabel)) return 15; if(/(60)/i.test(serviceLabel)) return 60; return 30; }
function backdropLimitByDuration(mins: number){ return mins>=60?4:2; }
function currency(n:number){ return new Intl.NumberFormat("en-PH", { style:"currency", currency:"PHP"}).format(n); }

// ---------- Main Component ----------
export default function App(){
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Selections
  const [serviceType, setServiceType] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [serviceGroup, setServiceGroup] = useState("");
  const [service, setService] = useState("");

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

  // Terms
  const [accepted, setAccepted] = useState(false);

  // Totals
  const sessionPrice = useMemo(() => {
    const baseInfo = SERVICE_INFO[service];
    if (!baseInfo) return 0;
    // Add ₱50 for Classic category
    return serviceCategory === "Classic" ? baseInfo.price + 50 : baseInfo.price;
  }, [service, serviceCategory]);
  const addonsTotal = useMemo(() => Object.entries(addons).reduce((sum,[id,qty])=>{
    const item = ADDONS.find(a=>a.id===id); return sum + (item ? (item.price * (qty||0)) : 0);
  },0), [addons]);
  const grandTotal = sessionPrice + addonsTotal;

  const slots = useMemo(()=>generateDailySlots(), []);
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
          const newAlloc: Record<string, number> = {};
          newBackdrops.forEach(bd => { newAlloc[bd] = perBackdrop; });
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
      const newAlloc: Record<string, number> = {};
      newBackdrops.forEach(bd => { newAlloc[bd] = perBackdrop; });
      setAllocations(newAlloc);
      return newBackdrops;
    }); 
  }
  function onAllocationChange(key:string,value:string){ const v=Math.max(0, Number(value)||0); setAllocations(prev=>({ ...prev, [key]: v })); }

async function submitBooking(){
  console.log('🎯 submitBooking called!');
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
      alert('Failed to create booking. Please try again.');
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    alert('Network error. Please check your connection.');
  } finally {
    console.log('🏁 setBusy(false)');
    setBusy(false);
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
    }// ADD emailVerified
      case 3: { // consent conditional questions - CHANGED
        if (!socialConsent) return false; // Always required
        
        const isPreBirthday = serviceGroup === "Kids Pre-birthday (Girls)" || serviceGroup === "Kids Pre-birthday (Boys)";
        const isChristmas = serviceType === "Seasonal Sessions";
        
        // Pre-birthday: always need name & age
        if (serviceType === "With Photographer" && isPreBirthday) {
          if (!celebrantName || !birthdayAge) return false;
        }
        
        // Christmas or if they said "yes" to social consent
        if (socialConsent === "yes"){
          if (isChristmas) {
            // Christmas: need celebrant name only
            if (!celebrantName) return false;
          } else {
            // All other cases
            if (!eventType || !celebrantName) return false;
            if (eventType === "Birthday" && (!birthdayAge || !eventDate)) return false;
            if (eventType === "Graduation/Moving Up" && (!graduationLevel || !eventDate)) return false;
            if (["Prenup", "Wedding", "Monthsary", "Anniversary", "Maternity", "Other"].includes(eventType) && !eventDate) return false;
          }
        }
        return true;
      }
      case 4: return serviceType !== "Self-Shoot" ? true : allocationValid; // backdrops
      case 5: return true; // add-ons optional
      case 6: return accepted; // terms
      case 7: return true; // review
      default: return false;
    }
  }, [step, service, date, time, firstName, lastName, email, phone, emailVerified, socialConsent, eventType, celebrantName, birthdayAge, graduationLevel, eventDate, allocationValid, accepted, serviceType, serviceGroup]);

  return (
    <div className="min-h-screen w-full flex items-start justify-center p-4 md:p-8" style={{ backgroundColor: BRAND.cream }}>
      <div className="w-full max-w-5xl">
        <Header onReset={()=>{ setStep(0); setServiceType(""); setServiceCategory(""); setServiceGroup(""); setService(""); }} />
        <Stepper step={step} />

        <Card className="mt-4 shadow-lg border-0 relative overflow-visible">
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
              />
            )}

            {step === 1 && (
              <StepSchedule date={date} setDate={setDate} time={time} setTime={setTime} duration={duration} availableSlots={availableSlots} />
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
            {step === 6 && (<StepVideoAndTerms accepted={accepted} setAccepted={setAccepted} />)}
            {step === 7 && (
              <StepReview data={{ serviceType, serviceCategory, serviceGroup, service, duration, date, time, firstName, lastName, email, phone, address, socialConsent, eventType, celebrantName, birthdayAge, graduationLevel, eventDate, selectedBackdrops, allocations, addons, sessionPrice, addonsTotal, grandTotal }} />
            )}
            {step === 8 && (<Confirmation />)}

            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" onClick={()=>setStep(Math.max(step-1,0))} disabled={step===0}><ChevronLeft className="w-4 h-4 mr-2"/> Back</Button>

              {step < 7 && (
                <Button 
                  onClick={()=>setStep(step+1)} 
                  disabled={!canContinue}
                  style={{ 
                    backgroundColor: canContinue ? BRAND.terracotta : "#ccc", 
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
                    backgroundColor: canContinue && !busy ? BRAND.clay : "#ccc", 
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
          © {new Date().getFullYear()} Memories Photography Studio — “Capturing moments, creating memories.”
        </footer>
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------
function Header({ onReset }:{ onReset: ()=>void }){
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Book your session</h1>
        <p className="text-neutral-500">book.memories-studio.com</p>
      </div>
      <Button variant="outline" onClick={onReset}>Start Over</Button>
    </div>
  );
}

const STEPS = [
  "Service (All-in-one)",
  "Date & Time",
  "Your Details",
  "Social & Event Info",
  "Backdrops & Time Allocation",
  "Add-ons",
  "Our Story & Terms",
  "Review",
  "Done",
];

function Stepper({ step }:{ step:number }){
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-2 mt-3">
      {STEPS.map((label,i)=> (
        <div 
          key={i} 
          className={cn("px-2 py-2 rounded-xl text-xs md:text-sm border transition")}
          style={i <= step ? {
            backgroundColor: BRAND.charcoal,
            color: BRAND.white,
            borderColor: BRAND.charcoal
          } : {
            backgroundColor: BRAND.white,
            borderColor: "#e5e5e5",
            color: "#737373"
          }}
        >
          {i+1}. {label}
        </div>
      ))}
    </div>
  );
}

// Unified one-step service selector with explicit accordions + prices + thumbnails
function StepServiceUnified({ serviceType, setServiceType, serviceCategory, setServiceCategory, serviceGroup, setServiceGroup, service, setService }:{
  serviceType:string; setServiceType:(v:string)=>void;
  serviceCategory:string; setServiceCategory:(v:string)=>void;
  serviceGroup:string; setServiceGroup:(v:string)=>void;
  service:string; setService:(v:string)=>void;
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
            className="border rounded-2xl overflow-hidden transition"
            style={{
              borderColor: openType === t ? BRAND.charcoal : "#e5e5e5",
              backgroundColor: openType === t ? BRAND.white : "#fafafa"
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
                      <div key={String(c)} className={cn("text-left border rounded-xl p-3 hover:shadow-sm transition flex items-start gap-3", serviceCategory===c?"border-neutral-900":"border-neutral-200")}>                      
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
                  // Auto-select Digital for With Photographer and Seasonal Sessions
                  (() => {
                    if (!serviceCategory) {
                      setServiceCategory("Digital");
                      setOpenCategory("Digital");
                    }
                    return (
                      <div className="mb-3 p-3 border rounded-xl bg-neutral-50">
                        <p className="text-sm text-neutral-600">📱 Digital-only package (photos delivered via Lightroom)</p>
                      </div>
                    );
                  })()
                )}

                {/* Groups */}
                {serviceCategory && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Groups</div>
                    <div className="grid md:grid-cols-3 gap-3">
                      {groups.map((g)=> (
                      <button 
                        key={g} 
                        className="text-left border rounded-xl p-3 hover:shadow-sm transition flex items-center gap-3"
                        style={{ borderColor: serviceGroup === g ? BRAND.charcoal : "#e5e5e5" }}
                        onClick={()=>toggleGroup(g)}
                      >
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-lg">{GROUP_THUMBS[g] || "📷"}</div>
                          <div>
                            <div className="font-medium">{g}</div>
                            {/* ✅ CHANGE THIS LINE */}
                            <div className="text-xs text-neutral-500">{getGroupDescription(g)}</div>
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
                        const info = SERVICE_INFO[s] || { details: "", price: 0 };
                        // Use classic details if Classic category is selected, otherwise use digital details
                        const displayDetails = serviceCategory === "Classic" && info.classicDetails ? info.classicDetails : info.details;
                        const displayPrice = serviceCategory === "Classic" ? info.price + 50 : info.price;
                        return (
                          <button 
                            key={s} 
                            onClick={()=> setService(s)} 
                            className="text-left border rounded-xl p-3 hover:shadow-md transition"
                            style={{ borderColor: service === s ? BRAND.charcoal : "#e5e5e5" }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold">{s}</div>
                                {displayDetails && (<div className="text-sm text-neutral-600 mt-1">{displayDetails}</div>)}
                              </div>
                              {displayPrice > 0 && (<Badge>{currency(displayPrice)}</Badge>)}
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
    </div>
  );
}

function StepSchedule({ date, setDate, time, setTime, duration, availableSlots }:{
  date:string; setDate:(v:string)=>void; time:string; setTime:(v:string)=>void; duration:number; availableSlots:string[];
}){
  return (
    <div>
      <h2 className="text-xl font-semibold">Select date & time</h2>
      <p className="text-neutral-600 mb-4">We show only logically available times with an automatic 30‑minute buffer between sessions.</p>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="text-sm font-medium">Date</label>
          <Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="mt-1"/>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Available times ({duration} mins)</label>
          <div className="mt-1 grid grid-cols-3 md:grid-cols-6 gap-2 max-h-64 overflow-auto p-1 border rounded-xl">
            {availableSlots.length===0 && (<div className="col-span-6 text-sm text-neutral-500 p-2">No available times for this date. Please try another day.</div>)}
            {availableSlots.map((s)=> (
              <button key={s} className={cn("text-sm border rounded-xl px-2 py-1 flex items-center justify-center", time===s?"border-neutral-900":"border-neutral-200")} onClick={()=>setTime(s)}>
                <Clock className="w-4 h-4 mr-1"/> {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-neutral-500 mt-3">Studio hours: {pad(SHOP_HOURS.open)}:00–{pad(SHOP_HOURS.close)}:00 ({STUDIO_TZ}) • Grid: {SLOT_MINUTES}‑minute slots • Buffer: {BUFFER_MINUTES} minutes</p>
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
}) {
  const { firstName, lastName, email, phone, address, setFirst, setLast, setEmail, setPhone, setAddr, emailVerified, setEmailVerified, verificationCode, setVerificationCode, sentCode, setSentCode } = props;
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
      // Change the alert to not show the code:
      alert(`✅ Verification code sent to ${email}!\n\nPlease check your email inbox (and spam folder).`);
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
      alert('✅ Email verified successfully!');
    } else {
      console.log('❌ Codes do not match');
      alert('❌ Invalid verification code. Please try again.');
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

      {/* Pre-birthday: Always ask name & age regardless of consent */}
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

      {socialConsent === "no" && !isPreBirthday && (
        <div className="mt-4 p-3 border rounded-xl bg-neutral-50">
          <p className="text-sm text-neutral-600">No problem! We respect your privacy and won&apos;t share your photos publicly.</p>
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
          <h3 className="font-medium mb-2">Order & time allocation</h3>
          <div className="space-y-2">
            {selected.map((key,idx)=>{
              const bd = BACKDROPS.find(b=>b.key===key);
              return (
                <div key={key} className="border rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg" style={{background: bd?.swatch}}/>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{idx+1}. {bd?.name}</div>
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
                      <div className="ml-2 text-xs text-neutral-500">First to last = shooting order</div>
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

function StepVideoAndTerms({ accepted, setAccepted }:{ accepted:boolean; setAccepted:(v:boolean)=>void; }){
  return (
    <div>
      <h2 className="text-xl font-semibold">Our story & terms</h2>
      <p className="text-neutral-600">Watch a short video about why we started Memories Photography Studio.</p>
      <div className="mt-3 aspect-video w-full rounded-2xl overflow-hidden bg-black">
        <video className="w-full h-full" src="" controls poster=""/>
      </div>
      <div className="mt-4 border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4"/><span className="font-medium">Terms & Conditions</span></div>
        <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1">
          <li>Two-time reschedule allowed; Cancellations after confirmation without a valid reason can subject you to a ban.</li>
          <li>Please arrive 5 minutes early; sessions end on time.</li>
          <li>Studio buffer of 30 minutes between sessions is automatic.</li>
          <li>By booking, you agree to our house rules and studio safety policy.</li>
        </ul>
        <label className="flex items-center gap-2 mt-3 text-sm">
          <Checkbox checked={accepted} onCheckedChange={(v)=>setAccepted(Boolean(v))}/> I agree to the Terms & Conditions
        </label>
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
          <Line label="Time" value={data.time}/>
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
