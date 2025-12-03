"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Plus, Trash2, Copy, Calendar as CalendarIcon, RefreshCw } from "lucide-react";

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface ShopHours {
  open: string;
  close: string;
  breaks: TimeSlot[];
  enabled: boolean;
}

interface BlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

type WeekSchedule = {
  [key: string]: ShopHours;
};

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<WeekSchedule>({
    Monday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
    Tuesday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
    Wednesday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
    Thursday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
    Friday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
    Saturday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
    Sunday: { open: "13:00", close: "20:00", breaks: [], enabled: true },
  });

  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([
    { id: "1", startDate: "2025-12-25", endDate: "2025-12-25", allDay: true, reason: "Christmas Day" },
    { id: "2", startDate: "2025-01-01", endDate: "2025-01-01", allDay: true, reason: "New Year" },
  ]);

  const [showBlockedDateForm, setShowBlockedDateForm] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState<Partial<BlockedDate>>({ allDay: true });
  const [hasChanges, setHasChanges] = useState(false);
  const [timezone] = useState("Asia/Manila");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const updateDay = (day: string, field: keyof ShopHours, value: any) => {
    setSchedule({ ...schedule, [day]: { ...schedule[day], [field]: value } });
    setHasChanges(true);
  };

  const addBreak = (day: string) => {
    const newBreak: TimeSlot = { id: Date.now().toString(), start: "15:00", end: "15:30" };
    updateDay(day, "breaks", [...schedule[day].breaks, newBreak]);
  };

  const updateBreak = (day: string, breakId: string, field: "start" | "end", value: string) => {
    const updatedBreaks = schedule[day].breaks.map((b) => b.id === breakId ? { ...b, [field]: value } : b);
    updateDay(day, "breaks", updatedBreaks);
  };

  const removeBreak = (day: string, breakId: string) => {
    updateDay(day, "breaks", schedule[day].breaks.filter((b) => b.id !== breakId));
  };

  const copyDaySchedule = (sourceDay: string) => {
    const sourceDaySchedule = schedule[sourceDay];
    const newSchedule = { ...schedule };
    Object.keys(newSchedule).forEach((day) => {
      if (day !== sourceDay) {
        newSchedule[day] = {
          ...sourceDaySchedule,
          breaks: sourceDaySchedule.breaks.map((b) => ({ ...b, id: Date.now().toString() + Math.random() })),
        };
      }
    });
    setSchedule(newSchedule);
    setHasChanges(true);
  };

  const addBlockedDate = () => {
    if (!newBlockedDate.startDate) return;
    const blocked: BlockedDate = {
      id: Date.now().toString(),
      startDate: newBlockedDate.startDate,
      endDate: newBlockedDate.endDate || newBlockedDate.startDate,
      allDay: newBlockedDate.allDay ?? true,
      startTime: newBlockedDate.startTime,
      endTime: newBlockedDate.endTime,
      reason: newBlockedDate.reason,
    };
    setBlockedDates([...blockedDates, blocked].sort((a, b) => a.startDate.localeCompare(b.startDate)));
    setNewBlockedDate({ allDay: true });
    setShowBlockedDateForm(false);
    setHasChanges(true);
  };

  const removeBlockedDate = (id: string) => {
    setBlockedDates(blockedDates.filter((d) => d.id !== id));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    setSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule, blockedDates, timezone }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save availability');
      }

      setSyncResult(result);
      setHasChanges(false);
      
      const notionStats = result.results.notionCreated || result.results.notionUpdated || result.results.notionDeleted;
      const alertMessage = notionStats
        ? `✅ 3-way sync completed successfully!\n\n` +
          `📊 Notion:\n` +
          `  • Created: ${result.results.notionCreated || 0}\n` +
          `  • Updated: ${result.results.notionUpdated || 0}\n` +
          `  • Archived: ${result.results.notionDeleted || 0}\n\n` +
          `📅 Google Calendar:\n` +
          `  • Created: ${result.results.blockedDatesCreated || 0}\n` +
          `  • Updated: ${result.results.blockedDatesUpdated || 0}\n` +
          `  • Deleted: ${result.results.blockedDatesDeleted || 0}\n` +
          `☕ Break events created: ${result.results.breaksCreated || 0}`
        : `✅ Availability synced to Google Calendar!\n\n` +
          `📅 Blocked dates created: ${result.results.blockedDatesCreated}\n` +
          `📝 Blocked dates updated: ${result.results.blockedDatesUpdated}\n` +
          `🗑️ Blocked dates removed: ${result.results.blockedDatesDeleted}\n` +
          `☕ Break events created: ${result.results.breaksCreated}\n\n` +
          `💡 Notion sync not configured. Set NOTION_AVAILABILITY_DATABASE_ID to enable.`;
      
      alert(alertMessage);
    } catch (error) {
      console.error('Error saving availability:', error);
      alert(`❌ Failed to save availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatDateRange = (blocked: BlockedDate) => {
    const start = new Date(blocked.startDate);
    const end = new Date(blocked.endDate);
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (blocked.startDate === blocked.endDate) return startStr;
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="space-y-6 max-w-4xl w-full px-4 sm:px-0">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3">
          <div>
            <h1 className="text-h1 font-semibold text-neutral-900">Availability</h1>
            <p className="text-base-body text-neutral-600 mt-1">Configure when you are available for bookings</p>
          </div>
          {hasChanges && (
            <Button 
              onClick={saveChanges} 
              disabled={syncing}
              className="bg-[#0b3d2e] hover:bg-[#0b3d2e]/90 shrink-0 w-full sm:w-auto text-h3"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Save & Sync to Calendar'
              )}
            </Button>
          )}
        </div>
      </div>

      <Card className="border border-neutral-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-h2 font-semibold text-neutral-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Working Hours
              </h2>
              <p className="text-base-body text-neutral-500 mt-1">Set your weekly schedule and break times</p>
            </div>
            <div className="flex items-center gap-2 text-h3 text-neutral-600">
              <span className="shrink-0">Timezone</span>
              <select className="border border-neutral-300 rounded-md px-3 py-1.5 text-h3 bg-white min-w-0">
                <option>{timezone}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-3">
            {Object.entries(schedule).map(([day, hours]) => (
              <div key={day} className="group">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 py-3 border-b border-neutral-100">
                  {/* Toggle and Day Name */}
                  <div className="flex items-center gap-3 sm:w-32 shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={hours.enabled} onChange={(e) => updateDay(day, "enabled", e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0b3d2e]"></div>
                    </label>
                    <span className="text-h3 font-medium text-neutral-700 min-w-[80px]">{day}</span>
                  </div>

                  {/* Time Slots - Better Mobile Alignment */}
                  <div className="flex-1 min-w-0">
                    {hours.enabled ? (
                      <div className="space-y-2">
                        {/* Working Hours */}
                        <div className="flex items-center gap-2">
                          <Input 
                            type="time" 
                            value={hours.open} 
                            onChange={(e) => updateDay(day, "open", e.target.value)} 
                            className="w-[105px] sm:w-[110px] h-9 text-sm" 
                          />
                          <span className="text-neutral-400 text-sm">to</span>
                          <Input 
                            type="time" 
                            value={hours.close} 
                            onChange={(e) => updateDay(day, "close", e.target.value)} 
                            className="w-[105px] sm:w-[110px] h-9 text-sm" 
                          />
                        </div>

                        {/* Breaks */}
                        {hours.breaks.map((breakSlot, idx) => (
                          <div key={breakSlot.id} className="flex items-center gap-2 sm:pl-4">
                            <span className="text-base-body text-neutral-500 w-[50px] shrink-0">{idx === 0 ? "Break:" : `Break ${idx + 1}:`}</span>
                            <Input 
                              type="time" 
                              value={breakSlot.start} 
                              onChange={(e) => updateBreak(day, breakSlot.id, "start", e.target.value)} 
                              className="w-[90px] sm:w-[105px] h-8 text-sm" 
                            />
                            <span className="text-neutral-400 text-xs">to</span>
                            <Input 
                              type="time" 
                              value={breakSlot.end} 
                              onChange={(e) => updateBreak(day, breakSlot.id, "end", e.target.value)} 
                              className="w-[90px] sm:w-[105px] h-8 text-sm" 
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeBreak(day, breakSlot.id)} 
                              className="h-8 w-8 p-0 text-neutral-400 hover:text-red-600 shrink-0 ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}

                        {/* Add Break Button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => addBreak(day)} 
                          className="h-8 text-xs text-[#0b3d2e] hover:text-[#0b3d2e] hover:bg-[#0b3d2e]/5 sm:ml-[54px]"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add a break
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-neutral-400">Unavailable</span>
                    )}
                  </div>

                  {/* Copy Button - Hidden on Mobile */}
                  <Button variant="ghost" size="sm" onClick={() => copyDaySchedule(day)} className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-neutral-400 hover:text-[#0b3d2e] shrink-0" title="Copy to all days">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="border border-neutral-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Date Overrides
              </h2>
              <p className="text-sm text-neutral-500 mt-1">Block off dates - syncs to Google Calendar automatically</p>
            </div>
            <Button 
              onClick={() => setShowBlockedDateForm(!showBlockedDateForm)} 
              size="sm" 
              className="bg-[#0b3d2e] hover:bg-[#0b3d2e]/90 shrink-0 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add override
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {showBlockedDateForm && (
            <div className="mb-6 p-3 sm:p-4 border border-neutral-200 rounded-lg bg-neutral-50">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">Add Date Override</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Start Date</label>
                  <Input type="date" value={newBlockedDate.startDate || ""} onChange={(e) => setNewBlockedDate({ ...newBlockedDate, startDate: e.target.value })} min={new Date().toISOString().split("T")[0]} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">End Date</label>
                  <Input type="date" value={newBlockedDate.endDate || newBlockedDate.startDate || ""} onChange={(e) => setNewBlockedDate({ ...newBlockedDate, endDate: e.target.value })} min={newBlockedDate.startDate || new Date().toISOString().split("T")[0]} className="w-full" />
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newBlockedDate.allDay} onChange={(e) => setNewBlockedDate({ ...newBlockedDate, allDay: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm text-neutral-700">All day</span>
                </label>
              </div>

              {!newBlockedDate.allDay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">Start Time</label>
                    <Input type="time" value={newBlockedDate.startTime || ""} onChange={(e) => setNewBlockedDate({ ...newBlockedDate, startTime: e.target.value })} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">End Time</label>
                    <Input type="time" value={newBlockedDate.endTime || ""} onChange={(e) => setNewBlockedDate({ ...newBlockedDate, endTime: e.target.value })} className="w-full" />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Reason (optional)</label>
                <Input type="text" value={newBlockedDate.reason || ""} onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })} placeholder="e.g., Holiday, Personal Time" className="w-full" />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={addBlockedDate} disabled={!newBlockedDate.startDate} className="bg-[#0b3d2e] hover:bg-[#0b3d2e]/90 w-full sm:w-auto">Save Override</Button>
                <Button variant="outline" onClick={() => { setShowBlockedDateForm(false); setNewBlockedDate({ allDay: true }); }} className="w-full sm:w-auto">Cancel</Button>
              </div>
            </div>
          )}

          {blockedDates.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">No date overrides yet. Add one to block specific dates or set custom hours.</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((blocked) => (
                <div key={blocked.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 break-words">{formatDateRange(blocked)}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {blocked.allDay ? (
                            <span className="text-xs text-neutral-500">All day</span>
                          ) : (
                            <span className="text-xs text-neutral-500">{blocked.startTime} - {blocked.endTime}</span>
                          )}
                          {blocked.reason && (
                            <>
                              <span className="text-neutral-300 hidden sm:inline">•</span>
                              <span className="text-xs text-neutral-500 break-words">{blocked.reason}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeBlockedDate(blocked.id)} 
                    className="h-8 w-8 p-0 text-neutral-400 hover:text-red-600 self-end sm:self-center shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}