"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings as SettingsIcon,
  Mail,
  Calendar,
  Database,
  Users,
  Bell,
  Key,
  Save,
  Check,
  AlertCircle,
} from "lucide-react";

export default function SettingsPage() {
  const [hasChanges, setHasChanges] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [emailSettings, setEmailSettings] = useState({
    notifyOnBooking: true,
    notifyOnCancellation: true,
    notifyOnRescheduling: false,
    webhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "",
  });

  const [bookingSettings, setBookingSettings] = useState({
    leadTime: 2,
    leadTimeUnit: 'hours' as 'minutes' | 'hours' | 'days',
    bookingSlotSize: 15,
    bookingSlotUnit: 'minutes' as 'minutes' | 'hours',
    schedulingWindow: 90,
    schedulingWindowUnit: 'days' as 'days' | 'months',
    cancellationPolicy: 2,
    cancellationPolicyUnit: 'hours' as 'hours' | 'days',
  });

  const [settingsDbConfigured, setSettingsDbConfigured] = useState(true);

  const [bccEmails, setBccEmails] = useState([
    "smile@memories-studio.com",
  ]);
  const [newEmail, setNewEmail] = useState("");

  const [integrations, setIntegrations] = useState({
    googleCalendar: {
      connected: true,
      calendarId: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || "",
      lastSync: "2 minutes ago",
    },
    notion: {
      connected: true,
      databaseId: process.env.NEXT_PUBLIC_NOTION_DATABASE_ID || "",
      lastSync: "Just now",
    },
  });

  const addEmail = () => {
    if (newEmail && !bccEmails.includes(newEmail)) {
      const updatedEmails = [...bccEmails, newEmail];
      setBccEmails(updatedEmails);
      setNewEmail("");
      setHasChanges(true);
      saveBccEmails(updatedEmails);
    }
  };

  const removeEmail = (email: string) => {
    // Don't allow removing the default email
    if (email === "smile@memories-studio.com") {
      alert("❌ Cannot remove the default studio email address");
      return;
    }
    const updatedEmails = bccEmails.filter((e) => e !== email);
    setBccEmails(updatedEmails);
    setHasChanges(true);
    saveBccEmails(updatedEmails);
  };

  const saveBccEmails = async (emails: string[]) => {
    try {
      const response = await fetch('/api/admin/settings/bcc-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ BCC emails saved successfully');
      } else if (data.needsSetup) {
        console.warn('⚠️ BCC emails saved (memory only) - Settings DB not configured');
      } else {
        console.error('Failed to save BCC emails:', data.error);
      }
    } catch (error) {
      console.error("Error saving BCC emails:", error);
    }
  };

  const saveSettings = async () => {
    try {
      console.log('[Settings] Saving booking settings...');
      const response = await fetch('/api/admin/booking-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Changed from 'include' to 'same-origin' for same-domain requests
        body: JSON.stringify(bookingSettings),
      });

      const data = await response.json();
      console.log('[Settings] Save response:', { status: response.status, data });

      if (response.ok && data.success) {
        setHasChanges(false);
        if (data.needsSetup) {
          alert("⚠️ Settings saved (memory only)\n\n" + data.warning + "\n\nSee BOOKING_SETTINGS_SETUP.md for setup instructions.");
        } else {
          alert("✅ Settings saved successfully!");
        }
      } else if (response.status === 401) {
        alert("❌ Unauthorized: " + (data.message || data.error || 'Please log in again'));
        console.error('Auth error:', data);
      } else {
        alert("❌ Failed to save settings: " + (data.error || data.message || 'Unknown error'));
        console.error('Save error:', data);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("❌ Network error: Failed to save settings. Please try again.");
    }
  };

  const runSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
      });
      const data = await response.json();
      setSyncResult(data);
      alert(`Sync complete! Created: ${data.summary?.created}, Skipped: ${data.summary?.skipped}, Errors: ${data.summary?.errors}`);
    } catch (error) {
      alert('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  // Load booking settings and BCC emails on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('[Settings] Loading booking settings...');
        const response = await fetch('/api/admin/booking-settings', {
          credentials: 'same-origin',
        });
        const data = await response.json();
        console.log('[Settings] Load response:', { status: response.status, data });
        
        if (response.ok && data.success && data.settings) {
          setBookingSettings(data.settings);
          setSettingsDbConfigured(!data.usingDefaults);
          console.log('[Settings] Settings loaded successfully');
        } else if (response.status === 401) {
          console.error('[Settings] Unauthorized - not logged in or session expired');
        } else {
          console.error('[Settings] Failed to load settings:', data);
        }
      } catch (error) {
        console.error("Error loading booking settings:", error);
      }
    };

    const loadBccEmails = async () => {
      try {
        console.log('[Settings] Loading BCC email addresses...');
        const response = await fetch('/api/admin/settings/bcc-emails', {
          credentials: 'same-origin',
        });
        const data = await response.json();
        
        if (response.ok && data.success && data.emails) {
          setBccEmails(data.emails);
          console.log('[Settings] BCC emails loaded:', data.emails);
        } else {
          console.error('[Settings] Failed to load BCC emails:', data);
        }
      } catch (error) {
        console.error("Error loading BCC emails:", error);
      }
    };

    loadSettings();
    loadBccEmails();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0b3d2e]">Settings</h1>
          <p className="text-neutral-600 mt-1">
            Configure integrations, notifications, and access control
          </p>
        </div>
        {hasChanges && (
          <Button
            onClick={saveSettings}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Integrations */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Key className="w-5 h-5 text-[#0b3d2e]" />
          <h2 className="text-xl font-bold text-[#0b3d2e]">Integrations</h2>
        </div>

        <div className="space-y-4">
          {/* Google Calendar */}
          <div className="flex items-start justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Google Calendar</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Sync bookings and check real-time availability
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  Calendar ID: {integrations.googleCalendar.calendarId.substring(0, 30)}...
                </p>
                <p className="text-xs text-neutral-500">
                  Last sync: {integrations.googleCalendar.lastSync}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-700 border-green-200"
            >
              <Check className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          </div>

          {/* Notion */}
          <div className="flex items-start justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Notion Database</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Store and manage booking data
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  Database ID: {integrations.notion.databaseId.substring(0, 30)}...
                </p>
                <p className="text-xs text-neutral-500">
                  Last sync: {integrations.notion.lastSync}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-700 border-green-200"
            >
              <Check className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          </div>

          {/* N8N Webhook */}
          <div className="flex items-start justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900">Email Notifications (N8N)</h3>
                <p className="text-sm text-neutral-600 mt-1 mb-2">
                  Automated email confirmations and reminders
                </p>
                <Input
                  value={emailSettings.webhookUrl}
                  onChange={(e) => {
                    setEmailSettings({ ...emailSettings, webhookUrl: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  className="text-xs"
                />
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                emailSettings.webhookUrl
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
              }
            >
              {emailSettings.webhookUrl ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pending
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Sync Button */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">🔄 Manual Sync</h3>
              <p className="text-sm text-neutral-600">
                Sync all Notion bookings to Google Calendar. Run this after manually adding bookings in Notion.
              </p>
              {syncResult && (
                <div className="mt-3 text-xs">
                  <p className="font-medium text-green-700">
                    ✓ Last sync: {syncResult.summary?.created} created, {syncResult.summary?.skipped} skipped, {syncResult.summary?.errors} errors
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={runSync}
              disabled={syncing}
              className="bg-blue-600 hover:bg-blue-700 text-white ml-4"
            >
              {syncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* BCC Email Addresses */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Mail className="w-5 h-5 text-[#0b3d2e]" />
          <h2 className="text-xl font-bold text-[#0b3d2e]">BCC Email Addresses</h2>
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
            Booking Confirmations
          </Badge>
        </div>

        <p className="text-sm text-neutral-600 mb-4">
          Add email addresses to receive a BCC copy of all booking confirmation emails sent to customers.
          Perfect for tracking bookings and keeping your team informed.
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1"
          />
          <Button
            onClick={addEmail}
            className="bg-[#0b3d2e] hover:bg-[#0a3426]"
            disabled={!newEmail}
          >
            <Mail className="w-4 h-4 mr-2" />
            Add Email
          </Button>
        </div>

        <div className="space-y-2">
          {bccEmails.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-neutral-500" />
                <span className="font-medium text-neutral-900">{email}</span>
                {email === "smile@memories-studio.com" && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                    Default
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEmail(email)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={email === "smile@memories-studio.com"}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-600 mt-4">
          💡 <strong>Note:</strong> These emails will receive blind carbon copies (BCC) of booking confirmations.
          Customers won't see these addresses in their email.
        </p>
      </Card>

      {/* Email Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-[#0b3d2e]" />
          <h2 className="text-xl font-bold text-[#0b3d2e]">Email Notifications</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition">
            <div>
              <p className="font-medium text-neutral-900">New Booking</p>
              <p className="text-sm text-neutral-600">
                Receive email when a new booking is made
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailSettings.notifyOnBooking}
              onChange={(e) => {
                setEmailSettings({
                  ...emailSettings,
                  notifyOnBooking: e.target.checked,
                });
                setHasChanges(true);
              }}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition">
            <div>
              <p className="font-medium text-neutral-900">Booking Cancellation</p>
              <p className="text-sm text-neutral-600">
                Receive email when a booking is cancelled
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailSettings.notifyOnCancellation}
              onChange={(e) => {
                setEmailSettings({
                  ...emailSettings,
                  notifyOnCancellation: e.target.checked,
                });
                setHasChanges(true);
              }}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition">
            <div>
              <p className="font-medium text-neutral-900">Booking Rescheduling</p>
              <p className="text-sm text-neutral-600">
                Receive email when a booking is rescheduled
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailSettings.notifyOnRescheduling}
              onChange={(e) => {
                setEmailSettings({
                  ...emailSettings,
                  notifyOnRescheduling: e.target.checked,
                });
                setHasChanges(true);
              }}
              className="w-5 h-5"
            />
          </label>
        </div>
      </Card>

      {/* Booking Policies */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-[#0b3d2e]" />
          <h2 className="text-xl font-bold text-[#0b3d2e]">Booking Policies</h2>
        </div>

        {!settingsDbConfigured && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">⚠️ Settings Database Not Configured</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  Changes will work but won't persist across deployments. To save settings permanently:
                </p>
                <ol className="text-xs text-yellow-800 space-y-1 ml-4 list-decimal">
                  <li>Create a "Settings" database in Notion</li>
                  <li>Add <code className="bg-yellow-100 px-1 rounded">NOTION_SETTINGS_DATABASE_ID</code> to your <code className="bg-yellow-100 px-1 rounded">.env.local</code></li>
                  <li>See <code className="bg-yellow-100 px-1 rounded">BOOKING_SETTINGS_SETUP.md</code> for complete instructions</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Lead Time */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Lead Time
              <span className="block text-xs text-neutral-600 font-normal">
                How much notice do you require before an appointment?
              </span>
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={bookingSettings.leadTime}
                onChange={(e) => {
                  setBookingSettings({ ...bookingSettings, leadTime: parseInt(e.target.value) || 1 });
                  setHasChanges(true);
                }}
                className="flex-1"
                placeholder="2"
              />
              <select 
                className="px-3 py-2 border rounded-lg bg-white"
                value={bookingSettings.leadTimeUnit}
                onChange={(e) => {
                  setBookingSettings({ ...bookingSettings, leadTimeUnit: e.target.value as 'minutes' | 'hours' | 'days' });
                  setHasChanges(true);
                }}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          {/* Booking Slot Size */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Booking Slot Size
              <span className="block text-xs text-neutral-600 font-normal">
                How often should available booking slots appear?
              </span>
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={bookingSettings.bookingSlotSize}
                onChange={(e) => {
                  setBookingSettings({ ...bookingSettings, bookingSlotSize: parseInt(e.target.value) || 15 });
                  setHasChanges(true);
                }}
                className="flex-1"
                placeholder="15"
              />
              <select 
                className="px-3 py-2 border rounded-lg bg-white"
                value={bookingSettings.bookingSlotUnit}
                onChange={(e) => {
                  setBookingSettings({ ...bookingSettings, bookingSlotUnit: e.target.value as 'minutes' | 'hours' });
                  setHasChanges(true);
                }}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>

          {/* Scheduling Window */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Scheduling Window
              <span className="block text-xs text-neutral-600 font-normal">
                How far in advance can customers schedule an appointment?
              </span>
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={bookingSettings.schedulingWindow}
                onChange={(e) => {
                  setBookingSettings({ ...bookingSettings, schedulingWindow: parseInt(e.target.value) || 90 });
                  setHasChanges(true);
                }}
                className="flex-1"
                placeholder="90"
              />
              <select 
                className="px-3 py-2 border rounded-lg bg-white"
                value={bookingSettings.schedulingWindowUnit}
                onChange={(e) => {
                  setBookingSettings({ ...bookingSettings, schedulingWindowUnit: e.target.value as 'days' | 'months' });
                  setHasChanges(true);
                }}
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Cancellation Policy
              <span className="block text-xs text-neutral-600 font-normal">
                How soon before an appointment can customers reschedule or cancel?
              </span>
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={bookingSettings.cancellationPolicy}
                onChange={(e) => {
                  setBookingSettings({ ...bookingSettings, cancellationPolicy: parseInt(e.target.value) || 2 });
                  setHasChanges(true);
                }}
                className="flex-1"
                placeholder="2"
              />
              <select 
                className="px-3 py-2 border rounded-lg bg-white"
                value={bookingSettings.cancellationPolicyUnit}
                onChange={(e) => {
                  setBookingSettings({ ...bookingSettings, cancellationPolicyUnit: e.target.value as 'hours' | 'days' });
                  setHasChanges(true);
                }}
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Changes to these settings will take effect immediately for new bookings.
            Existing bookings will not be affected.
          </p>
        </div>
      </Card>

      {/* System Info */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-[#0b3d2e] mb-3">📊 System Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-600">Next.js Version</p>
            <p className="font-medium">15.5.6</p>
          </div>
          <div>
            <p className="text-neutral-600">React Version</p>
            <p className="font-medium">19.1.0</p>
          </div>
          <div>
            <p className="text-neutral-600">Environment</p>
            <p className="font-medium">{typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'Development' : 'Production'}</p>
          </div>
          <div>
            <p className="text-neutral-600">Deployment</p>
            <p className="font-medium">{typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'Local' : 'Vercel'}</p>
          </div>
          <div>
            <p className="text-neutral-600">URL</p>
            <p className="font-medium text-xs">{typeof window !== 'undefined' ? window.location.origin : 'Loading...'}</p>
          </div>
          <div>
            <p className="text-neutral-600">Git Commit</p>
            <p className="font-medium text-xs" title={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'd7f1b5f'}>
              {(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'd7f1b5f').substring(0, 7)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
