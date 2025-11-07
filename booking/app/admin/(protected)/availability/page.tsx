"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Coffee, Ban, Save } from "lucide-react";

interface ShopHours {
  open: string;
  close: string;
  lunchStart: string;
  lunchEnd: string;
  enabled: boolean;
}

type WeekSchedule = {
  [key: string]: ShopHours;
};

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<WeekSchedule>({
    Monday: { open: "08:00", close: "20:00", lunchStart: "12:00", lunchEnd: "13:00", enabled: true },
    Tuesday: { open: "08:00", close: "20:00", lunchStart: "12:00", lunchEnd: "13:00", enabled: true },
    Wednesday: { open: "08:00", close: "20:00", lunchStart: "12:00", lunchEnd: "13:00", enabled: true },
    Thursday: { open: "08:00", close: "20:00", lunchStart: "12:00", lunchEnd: "13:00", enabled: true },
    Friday: { open: "08:00", close: "20:00", lunchStart: "12:00", lunchEnd: "13:00", enabled: true },
    Saturday: { open: "10:00", close: "20:00", lunchStart: "12:00", lunchEnd: "13:00", enabled: true },
    Sunday: { open: "13:00", close: "20:00", lunchStart: "", lunchEnd: "", enabled: true },
  });

  const [blockedDates, setBlockedDates] = useState<string[]>([
    "2025-12-25", // Christmas
    "2025-01-01", // New Year
  ]);

  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const updateDay = (day: string, field: keyof ShopHours, value: string | boolean) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], [field]: value },
    });
    setHasChanges(true);
  };

  const addBlockedDate = () => {
    if (newBlockedDate && !blockedDates.includes(newBlockedDate)) {
      setBlockedDates([...blockedDates, newBlockedDate].sort());
      setNewBlockedDate("");
      setHasChanges(true);
    }
  };

  const removeBlockedDate = (date: string) => {
    setBlockedDates(blockedDates.filter((d) => d !== date));
    setHasChanges(true);
  };

  const saveChanges = () => {
    // TODO: Save to backend/config
    console.log("Saving schedule:", schedule);
    console.log("Saving blocked dates:", blockedDates);
    setHasChanges(false);
    alert("Changes saved successfully!");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0b3d2e]">Availability</h1>
          <p className="text-neutral-600 mt-1">
            Manage business hours, lunch breaks, and blocked dates
          </p>
        </div>
        {hasChanges && (
          <Button
            onClick={saveChanges}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Weekly Schedule */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[#0b3d2e]" />
          <h2 className="text-xl font-bold text-[#0b3d2e]">Weekly Schedule</h2>
        </div>
        <div className="space-y-4">
          {Object.entries(schedule).map(([day, hours]) => (
            <div
              key={day}
              className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-neutral-50 rounded-lg"
            >
              <div className="flex items-center gap-3 md:w-40">
                <input
                  type="checkbox"
                  checked={hours.enabled}
                  onChange={(e) => updateDay(day, "enabled", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-semibold text-neutral-900">{day}</span>
              </div>

              {hours.enabled ? (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm text-neutral-600 w-16">Open:</label>
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateDay(day, "open", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-neutral-400">—</span>
                    <label className="text-sm text-neutral-600 w-16">Close:</label>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateDay(day, "close", e.target.value)}
                      className="w-32"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <Coffee className="w-4 h-4 text-neutral-500" />
                    <label className="text-sm text-neutral-600 w-16">Lunch:</label>
                    <Input
                      type="time"
                      value={hours.lunchStart}
                      onChange={(e) => updateDay(day, "lunchStart", e.target.value)}
                      className="w-32"
                      placeholder="Start"
                    />
                    <span className="text-neutral-400">—</span>
                    <Input
                      type="time"
                      value={hours.lunchEnd}
                      onChange={(e) => updateDay(day, "lunchEnd", e.target.value)}
                      className="w-32"
                      placeholder="End"
                    />
                  </div>
                </>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Closed
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Blocked Dates */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Ban className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-bold text-[#0b3d2e]">Blocked Dates</h2>
        </div>

        {/* Add New Blocked Date */}
        <div className="flex gap-2 mb-4">
          <Input
            type="date"
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="flex-1"
          />
          <Button
            onClick={addBlockedDate}
            className="bg-red-600 hover:bg-red-700"
            disabled={!newBlockedDate}
          >
            <Ban className="w-4 h-4 mr-2" />
            Block Date
          </Button>
        </div>

        {/* Blocked Dates List */}
        {blockedDates.length === 0 ? (
          <p className="text-neutral-600 text-sm">No blocked dates</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {blockedDates.map((date) => (
              <div
                key={date}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    {formatDate(date)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlockedDate(date)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Service Restrictions Info */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-[#0b3d2e] mb-2">
          📋 Current Service Restrictions
        </h3>
        <div className="space-y-2 text-sm text-neutral-700">
          <div className="p-3 bg-white rounded border border-blue-200">
            <p className="font-medium">With Photographer</p>
            <p className="text-neutral-600 text-xs mt-1">Available 8AM-6PM only</p>
          </div>
          <div className="p-3 bg-white rounded border border-blue-200">
            <p className="font-medium">Christmas Package</p>
            <p className="text-neutral-600 text-xs mt-1">
              Available only on: Nov 21, Nov 28, Dec 5, Dec 6, Dec 13
            </p>
          </div>
          <p className="text-xs text-neutral-600 mt-3">
            Note: Service-specific restrictions are managed in the Services page
          </p>
        </div>
      </Card>

      {/* Calendar Integration Status */}
      <Card className="p-6">
        <h3 className="font-semibold text-[#0b3d2e] mb-3">
          🔗 Google Calendar Integration
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              ✓ Connected
            </Badge>
            <p className="text-sm text-neutral-600 mt-2">
              Real-time availability synced with Google Calendar
            </p>
          </div>
          <Button variant="outline" size="sm">
            Reconnect Calendar
          </Button>
        </div>
      </Card>
    </div>
  );
}
