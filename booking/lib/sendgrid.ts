/**
 * SendGrid Email Service
 * Handles all email communications for the booking system
 */

import sgMail from '@sendgrid/mail';
import { formatTimeTo12Hour, formatManilaDateTime } from './time-utils';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@memories-studio.com';
const FROM_NAME = 'Memories Photography Studio';

interface BookingData {
  bookingId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  selections: {
    serviceType: string;
    serviceCategory: string;
    serviceGroup?: string;
    service: string;
    duration: number;
    description?: string;
  };
  schedule: {
    date: string;
    time: string;
  };
  totals: {
    sessionPrice: number;
    addonsTotal: number;
    grandTotal: number;
  };
  addons?: Record<string, number>;
  selfShoot?: {
    backdrops?: string[];
    allocations?: Record<string, number>;
  };
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(email: string, otpCode: string): Promise<boolean> {
  try {
    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: 'Your Verification Code - Memories Photography Studio',
      text: `Your verification code is: ${otpCode}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #FAF3E0;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #0b3d2e; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: bold;">Memories Photography Studio</h1>
                      <p style="margin: 10px 0 0 0; color: #FAF3E0; font-size: 14px;">Capture With Purpose. Create Change.</p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #2C2C2C; font-size: 24px;">Email Verification</h2>
                      <p style="margin: 0 0 20px 0; color: #2C2C2C; font-size: 16px; line-height: 1.5;">
                        Thank you for choosing Memories Photography Studio! Please use the verification code below to complete your action:
                      </p>
                      
                      <!-- OTP Code Box -->
                      <div style="background-color: #FAF3E0; border: 2px dashed #0b3d2e; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                        <p style="margin: 0; color: #0b3d2e; font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</p>
                      </div>
                      
                      <p style="margin: 20px 0 0 0; color: #666; font-size: 14px; line-height: 1.5;">
                        ⏱️ This code will expire in <strong>5 minutes</strong>.
                      </p>
                      <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; line-height: 1.5;">
                        If you didn't request this code, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f5f5f5; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #666; font-size: 12px;">
                        Memories Photography Studio<br>
                        Indang, Cavite<br>
                        📧 Email: <a href="mailto:smile@memories-studio.com" style="color: #0b3d2e; text-decoration: none;">smile@memories-studio.com</a><br>
                        📱 Phone: 0906 469 4122
                      </p>
                      <p style="margin: 15px 0 0 0; color: #999; font-size: 11px;">
                        © ${new Date().getFullYear()} Memories Photography Studio. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const response = await sgMail.send(msg);
    console.log('✅ SendGrid API Response:', response[0].statusCode, response[0].headers);
    console.log('✅ OTP email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('❌ SendGrid OTP email error:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('❌ SendGrid Error Details:', {
        statusCode: sgError.code,
        body: sgError.response?.body,
        headers: sgError.response?.headers,
      });
    }
    return false;
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(bookingData: BookingData): Promise<boolean> {
  try {
    const { bookingId, customer, selections, schedule, totals, addons } = bookingData;
    
    // Format date and time
    const formattedDateTime = formatManilaDateTime(schedule.date, schedule.time);
    const formattedTime = formatTimeTo12Hour(schedule.time);
    
    // Format addons list
    const addonsList = addons && Object.keys(addons).length > 0
      ? Object.entries(addons)
          .filter(([_, qty]) => qty > 0)
          .map(([name, qty]) => `${name} (×${qty})`)
          .join(', ')
      : 'None';

    const msg = {
      to: customer.email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `Booking Confirmed - ${bookingId} | Memories Photography Studio`,
      text: `
Booking Confirmation

Dear ${customer.firstName} ${customer.lastName},

Your booking has been confirmed! Here are your details:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOKING ID: ${bookingId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SESSION INFORMATION:
• Service: ${selections.service}
${selections.description ? `• Details: ${selections.description.replace(/\n/g, '\n  ')}` : ''}
• Date & Time: ${formattedDateTime} (${formattedTime})
• Duration: ${selections.duration} minutes
• Type: ${selections.serviceType}
• Category: ${selections.serviceCategory}
${bookingData.selfShoot?.backdrops && bookingData.selfShoot.backdrops.length > 0 ? `• Backdrops: ${bookingData.selfShoot.backdrops.join(', ')}` : ''}
${addonsList !== 'None' ? `• Add-ons: ${addonsList}` : ''}

PRICING:
• Session Price: ₱${totals.sessionPrice.toLocaleString()}
• Add-ons Total: ₱${totals.addonsTotal.toLocaleString()}
• Grand Total: ₱${totals.grandTotal.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT REMINDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📸 PHOTO DELIVERY:
• Your photos will be delivered ONLY via Adobe Lightroom
• We do not send photos through any other platform (Google Drive, Dropbox, Messenger)
• Please ensure you have an Adobe Lightroom account (free)
• Download the Lightroom Mobile App if accessing via mobile/tablet

📍 STUDIO LOCATION:
Studio Address:
• Located inside Green Valley Field Subdivision, between Lintiw Road and Indang Central Elementary School
• Enter the subdivision, go straight to the dead end, then turn right
• We're the fourth gate on the left, with a Memories Photography Studio tarpaulin near the gate
• Our studio is at the back of the property — the dark gray and blue painted house (not the house at the front)
• Google Maps: https://maps.app.goo.gl/kcjjzkZnvvpxJmQL9

Respect the Neighborhood:
• Please be courteous to the residents in front of the property
• Avoid being noisy, nosy, or disruptive while waiting or shooting

🚗 PARKING GUIDELINES:
• Park under the rambutan tree (designated parking area), OR on the vacant corner lot to the left
• DO NOT block the gate or driveway at any time

📅 BOOKING POLICY:
Arrival Guidelines:
• Arrive at least 5 minutes before your scheduled time
• Late arrivals will have the lost time deducted from their session
• We provide 5 minutes of extra time for outfit or backdrop changes
• Our timer starts at your session time plus 5 minutes (for setup and backdrop transitions)
• Timers are set per backdrop
• Timer stoppage or pauses are solely under the studio's discretion

Tardy Penalties:
🕒 Sessions 30 Minutes and Below:
  • 5-minute grace period
  • More than 5 minutes late: Time reduced + Limited to 1 backdrop
  • 10+ minutes late: Booking will be CANCELLED

🕓 1-Hour Sessions:
  • 5-20 minutes late: Time reduced + Limited to 2 backdrops
  • 30+ minutes late: Booking will be CANCELLED

📷 With Photographer / Occasional:
  • 10-minute grace period
  • 10-25 minutes late: Time reduced
  • 25+ minutes late: Booking will be CANCELLED

Reschedule & Cancellation:
• Reschedule/cancel at least 2 hours before with a valid reason
• Maximum of 2 reschedules per booking
• Late cancellation or no-show may result in a ban from future bookings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View your booking online: https://book.memories-studio.com/my-bookings

Thank you for choosing Memories Photography Studio!
"Capture With Purpose. Create Change."

Best regards,
Memories Photography Studio Team

Indang, Cavite
Email: smile@memories-studio.com
Phone: 0906 469 4122
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #FAF3E0;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #0b3d2e; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: bold;">Booking Confirmed!</h1>
                      <p style="margin: 10px 0 0 0; color: #FAF3E0; font-size: 14px;">Memories Photography Studio</p>
                    </td>
                  </tr>
                  
                  <!-- Booking ID -->
                  <tr>
                    <td style="padding: 30px 40px 20px 40px; text-align: center; background-color: #f0f8f5;">
                      <p style="margin: 0 0 5px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Booking ID</p>
                      <p style="margin: 0; color: #0b3d2e; font-size: 24px; font-weight: bold; font-family: 'Courier New', monospace;">${bookingId}</p>
                    </td>
                  </tr>
                  
                  <!-- Customer Info -->
                  <tr>
                    <td style="padding: 30px 40px 20px 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #0b3d2e; font-size: 20px; border-bottom: 2px solid #0b3d2e; padding-bottom: 10px;">Booking Details</h2>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px; width: 40%;">Customer:</td>
                          <td style="padding: 8px 0; color: #2C2C2C; font-size: 14px; font-weight: 600;">${customer.firstName} ${customer.lastName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">Email:</td>
                          <td style="padding: 8px 0; color: #2C2C2C; font-size: 14px;">${customer.email}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">Phone:</td>
                          <td style="padding: 8px 0; color: #2C2C2C; font-size: 14px;">${customer.phone}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Session Details -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #0b3d2e; font-size: 20px; border-bottom: 2px solid #0b3d2e; padding-bottom: 10px;">Session Information</h2>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td colspan="2" style="padding: 8px 0; color: #2C2C2C; font-size: 16px; font-weight: 600; border-bottom: 1px solid #e0e0e0;">
                            ${selections.service}
                          </td>
                        </tr>
                        ${selections.description ? `
                        <tr>
                          <td colspan="2" style="padding: 12px; background-color: #f8f9fa; border-radius: 6px; color: #555; font-size: 13px; line-height: 1.6;">
                            ${selections.description.replace(/\n/g, '<br>')}
                          </td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px; width: 35%;">📅 Date & Time:</td>
                          <td style="padding: 8px 0; color: #2C2C2C; font-size: 14px; font-weight: 600;">${formattedDateTime} (${formattedTime})</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">⏱️ Duration:</td>
                          <td style="padding: 8px 0; color: #2C2C2C; font-size: 14px;">${selections.duration} minutes</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">📷 Type:</td>
                          <td style="padding: 8px 0; color: #2C2C2C; font-size: 14px;">${selections.serviceType}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">🎯 Category:</td>
                          <td style="padding: 8px 0; color: #2C2C2C; font-size: 14px;">${selections.serviceCategory}</td>
                        </tr>
                        ${bookingData.selfShoot?.backdrops && bookingData.selfShoot.backdrops.length > 0 ? `
                        <tr>
                          <td style="padding: 12px 0 8px 0; color: #666; font-size: 14px; vertical-align: top;">🎨 Selected Backdrops:</td>
                          <td style="padding: 12px 0 8px 0;">
                            ${bookingData.selfShoot.backdrops.map(backdrop => `
                              <span style="display: inline-block; background-color: #0b3d2e; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; margin: 2px 4px 2px 0;">${backdrop}</span>
                            `).join('')}
                          </td>
                        </tr>
                        ` : ''}
                        ${addonsList !== 'None' ? `
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">✨ Add-ons:</td>
                          <td style="padding: 8px 0; color: #2C2C2C; font-size: 14px; font-weight: 600;">${addonsList}</td>
                        </tr>
                        ` : ''}
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Pricing -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #0b3d2e; font-size: 20px; border-bottom: 2px solid #0b3d2e; padding-bottom: 10px;">Pricing</h2>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">Session Price:</td>
                          <td style="padding: 8px 0; color: #2C2C2C; font-size: 14px; text-align: right;">₱${totals.sessionPrice.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;">Add-ons Total:</td>
                          <td style="padding: 8px 0; color: #2C2C2C; font-size: 14px; text-align: right;">₱${totals.addonsTotal.toLocaleString()}</td>
                        </tr>
                        <tr style="border-top: 2px solid #0b3d2e;">
                          <td style="padding: 12px 0 8px 0; color: #0b3d2e; font-size: 16px; font-weight: bold;">Grand Total:</td>
                          <td style="padding: 12px 0 8px 0; color: #0b3d2e; font-size: 18px; font-weight: bold; text-align: right;">₱${totals.grandTotal.toLocaleString()}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Important Reminders -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px;">
                        <h3 style="margin: 0 0 15px 0; color: #856404; font-size: 18px; font-weight: bold;">⚠️ Important Reminders</h3>
                        
                        <div style="margin-bottom: 15px;">
                          <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: bold;">📸 Photo Delivery:</p>
                          <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 13px; line-height: 1.6;">
                            <li>Your photos will be delivered <strong>ONLY via Adobe Lightroom</strong></li>
                            <li><strong>We do not send photos through any other platform</strong> (Google Drive, Dropbox, Messenger)</li>
                            <li>Please ensure you have an <strong>Adobe Lightroom account</strong> (free)</li>
                            <li>Download the <strong>Lightroom Mobile App</strong> if accessing via mobile/tablet</li>
                          </ul>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                          <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: bold;">📍 Studio Location:</p>
                          <p style="margin: 0 0 4px 0; padding-left: 20px; color: #856404; font-size: 13px;"><strong>Studio Address:</strong></p>
                          <ul style="margin: 0; padding-left: 40px; color: #856404; font-size: 12px; line-height: 1.5;">
                            <li>Located inside <strong>Green Valley Field Subdivision</strong>, between Lintiw Road and Indang Central Elementary School</li>
                            <li>Enter the subdivision, go straight to the dead end, then turn right</li>
                            <li>We're the <strong>fourth gate on the left</strong>, with a <strong>Memories Photography Studio tarpaulin</strong></li>
                            <li>Our studio is at the back — the <strong>dark gray and blue painted house</strong> (not the house at the front)</li>
                            <li><a href="https://maps.app.goo.gl/kcjjzkZnvvpxJmQL9" style="color: #0b3d2e; font-weight: bold;">View on Google Maps</a></li>
                          </ul>
                          <p style="margin: 8px 0 4px 0; padding-left: 20px; color: #856404; font-size: 13px;"><strong>Respect the Neighborhood:</strong></p>
                          <ul style="margin: 0; padding-left: 40px; color: #856404; font-size: 12px; line-height: 1.5;">
                            <li>Be courteous to the residents in front of the property</li>
                            <li>Avoid being noisy, nosy, or disruptive</li>
                          </ul>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                          <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: bold;">🚗 Parking Guidelines:</p>
                          <ul style="margin: 0; padding-left: 40px; color: #856404; font-size: 12px; line-height: 1.5;">
                            <li>Park <strong>under the rambutan tree</strong> OR <strong>on the vacant corner lot to the left</strong></li>
                            <li><strong>DO NOT block the gate or driveway at any time</strong></li>
                          </ul>
                        </div>
                        
                        <div>
                          <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: bold;">📅 Booking Policy:</p>
                          <p style="margin: 0 0 4px 0; padding-left: 20px; color: #856404; font-size: 13px;"><strong>Arrival Guidelines:</strong></p>
                          <ul style="margin: 0; padding-left: 40px; color: #856404; font-size: 12px; line-height: 1.5;">
                            <li>Arrive <strong>at least 5 minutes before</strong> your scheduled time</li>
                            <li>Late arrivals will have the lost time deducted from their session</li>
                            <li>We provide 5 minutes extra time for outfit/backdrop changes</li>
                            <li>Timer starts at your session time + 5 minutes</li>
                            <li>Timers are set per backdrop</li>
                            <li>Timer stoppage/pauses are at studio's discretion</li>
                          </ul>
                          <p style="margin: 8px 0 4px 0; padding-left: 20px; color: #dc3545; font-size: 13px;"><strong>Tardy Penalties:</strong></p>
                          <ul style="margin: 0; padding-left: 40px; color: #856404; font-size: 11px; line-height: 1.4;">
                            <li><strong>30-min sessions:</strong> 5-min grace; &gt;5 min late = time reduced + 1 backdrop only; 10+ min = CANCELLED</li>
                            <li><strong>1-hour sessions:</strong> 5-20 min late = time reduced + 2 backdrops max; 30+ min = CANCELLED</li>
                            <li><strong>With Photographer:</strong> 10-min grace; 10-25 min late = time reduced; 25+ min = CANCELLED</li>
                          </ul>
                          <p style="margin: 8px 0 4px 0; padding-left: 20px; color: #856404; font-size: 13px;"><strong>Reschedule & Cancellation:</strong></p>
                          <ul style="margin: 0; padding-left: 40px; color: #856404; font-size: 12px; line-height: 1.5;">
                            <li>Reschedule/cancel at least <strong>2 hours before</strong> with a valid reason</li>
                            <li>Maximum of <strong>2 reschedules</strong> per booking</li>
                            <li>Late cancellation or no-show may result in a ban</li>
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- CTA Button -->
                  <tr>
                    <td style="padding: 20px 40px 40px 40px; text-align: center;">
                      <a href="https://book.memories-studio.com/my-bookings" style="display: inline-block; padding: 15px 40px; background-color: #0b3d2e; color: #FFFFFF; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">View My Bookings</a>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f5f5f5; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #666; font-size: 12px;">
                        <strong>Memories Photography Studio</strong><br>
                        "Capture With Purpose. Create Change."<br>
                        Indang, Cavite<br>
                        📧 <a href="mailto:smile@memories-studio.com" style="color: #0b3d2e; text-decoration: none;">smile@memories-studio.com</a><br>
                        📱 0906 469 4122
                      </p>
                      <p style="margin: 15px 0 0 0; color: #999; font-size: 11px;">
                        © ${new Date().getFullYear()} Memories Photography Studio. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const response = await sgMail.send(msg);
    console.log('✅ SendGrid API Response:', response[0].statusCode, response[0].headers);
    console.log('✅ Booking confirmation email sent successfully to:', customer.email);
    return true;
  } catch (error) {
    console.error('❌ SendGrid booking confirmation email error:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('❌ SendGrid Error Details:', {
        statusCode: sgError.code,
        body: sgError.response?.body,
        headers: sgError.response?.headers,
      });
    }
    return false;
  }
}

/**
 * Send email verification code (for booking management)
 */
export async function sendEmailVerificationCode(email: string, verificationCode: string): Promise<boolean> {
  return sendOTPEmail(email, verificationCode); // Same template as OTP
}
