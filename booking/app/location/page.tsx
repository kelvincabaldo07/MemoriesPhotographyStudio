"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BRAND = {
  charcoal: "#2C2C2C",
  cream: "#FAF3E0",
  white: "#FFFFFF",
  forest: "#0b3d2e",
  terracotta: "#A62F20",
};

export default function LocationPage() {
  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: BRAND.cream }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => window.location.href = '/'}>
            ← Back to Home
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            <h1 className="text-3xl font-semibold mb-2" style={{ color: BRAND.forest }}>
              📍 Studio Location
            </h1>
            <p className="text-neutral-600 mb-6">
              Find us easily and plan your visit
            </p>

            {/* Google Map Embed */}
            <div className="mb-6 rounded-xl overflow-hidden border shadow-sm">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d600.6082789609123!2d120.8823626!3d14.1907713!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd83b509678963%3A0xc0b4d56ba848e15a!2sMemories%20Photography%20Studio!5e1!3m2!1sen!2sph!4v1762257396533!5m2!1sen!2sph"
                width="100%" 
                height="400" 
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <a 
              href="https://maps.app.goo.gl/V9HJxvk118gvcm3H6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg mb-6 hover:opacity-80 transition shadow-sm"
              style={{ backgroundColor: BRAND.forest, color: BRAND.white }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Open in Google Maps
            </a>

            {/* Location Details */}
            <div className="space-y-4">
              {/* Address */}
              <div className="p-6 rounded-xl border bg-white shadow-sm">
                <h3 className="font-semibold mb-3 text-lg" style={{ color: BRAND.forest }}>📍 Address & Directions</h3>
                <p className="text-neutral-700 leading-relaxed">
                  We are located inside <strong>Green Valley Field Subdivision, Indang, Cavite</strong> — between Indang Central Elementary School and Lintiw Road. 
                  Just go straight until it's the deadend then turn right. We are on the third gate to the left with the rambutan tree and a Memories Photography Studio tarpaulin.
                </p>
              </div>

              {/* Parking */}
              <div className="p-6 rounded-xl border shadow-sm" style={{ backgroundColor: `${BRAND.terracotta}10`, borderColor: BRAND.terracotta }}>
                <h3 className="font-semibold mb-3 text-lg flex items-center gap-2" style={{ color: BRAND.terracotta }}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                  🚗 Parking Information
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Street parking available in front of the property</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span><strong>Please do not block the gate</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span>No parking inside (space is not owned by us)</span>
                  </li>
                </ul>
              </div>

              {/* How to Find Us */}
              <div className="p-6 rounded-xl border bg-white shadow-sm">
                <h3 className="font-semibold mb-3 text-lg" style={{ color: BRAND.forest }}>🏠 How to Find Us</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>We&apos;re at the <strong>second house at the back</strong> (painted gray and blue)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Don&apos;t go to the first house near the front</span>
                  </li>
                </ul>
              </div>

              {/* When You Arrive */}
              <div className="p-6 rounded-xl border shadow-sm" style={{ backgroundColor: `${BRAND.forest}10`, borderColor: BRAND.forest }}>
                <h3 className="font-semibold mb-3 text-lg" style={{ color: BRAND.forest }}>📞 When You Arrive</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span style={{ color: BRAND.forest }}>1.</span>
                    <span>Call or message us on Facebook once you&apos;re at the gate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: BRAND.forest }}>2.</span>
                    <span>We will meet you and guide you to the studio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: BRAND.forest }}>⏰</span>
                    <span><strong>Arrive 5 minutes early or on time</strong> — we strictly follow our schedule to respect everyone&apos;s time</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <footer className="text-xs text-center text-neutral-500 mt-8">
          © {new Date().getFullYear()} Memories Photography Studio — "Capture With Purpose. Create Change."
        </footer>
      </div>
    </div>
  );
}