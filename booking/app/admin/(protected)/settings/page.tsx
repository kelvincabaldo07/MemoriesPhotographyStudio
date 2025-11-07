"use client";

import { useState } from "react";
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
  const [emailSettings, setEmailSettings] = useState({
    notifyOnBooking: true,
    notifyOnCancellation: true,
    notifyOnRescheduling: false,
    webhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "",
  });

  const [authorizedEmails, setAuthorizedEmails] = useState([
    "smile@memories-studio.com",
    "kelvin.cabaldo@gmail.com",
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
    if (newEmail && !authorizedEmails.includes(newEmail)) {
      setAuthorizedEmails([...authorizedEmails, newEmail]);
      setNewEmail("");
      setHasChanges(true);
    }
  };

  const removeEmail = (email: string) => {
    setAuthorizedEmails(authorizedEmails.filter((e) => e !== email));
    setHasChanges(true);
  };

  const saveSettings = () => {
    // TODO: Save to backend
    console.log("Saving settings...");
    setHasChanges(false);
    alert("Settings saved successfully!");
  };

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

      {/* Authorized Users */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-[#0b3d2e]" />
          <h2 className="text-xl font-bold text-[#0b3d2e]">Authorized Admin Users</h2>
        </div>

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
            Add Email
          </Button>
        </div>

        <div className="space-y-2">
          {authorizedEmails.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-neutral-500" />
                <span className="font-medium text-neutral-900">{email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEmail(email)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-600 mt-4">
          Only these email addresses can access the admin dashboard
        </p>
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
            <p className="text-neutral-600">Environment</p>
            <p className="font-medium">Production</p>
          </div>
          <div>
            <p className="text-neutral-600">Deployment</p>
            <p className="font-medium">Vercel</p>
          </div>
          <div>
            <p className="text-neutral-600">Last Deploy</p>
            <p className="font-medium">Nov 7, 2025</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
