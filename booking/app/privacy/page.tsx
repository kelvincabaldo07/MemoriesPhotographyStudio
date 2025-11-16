export const metadata = {
  title: 'Privacy Policy | Memories Photography Studio',
  description: 'Privacy policy for Memories Photography Studio booking system',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Effective Date:</strong> November 16, 2025<br />
            <strong>Last Updated:</strong> November 16, 2025
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-foreground">
              Memories Photography Studio ("we", "us", "our") respects your privacy and is committed to protecting your personal data. 
              This privacy policy explains how we collect, use, process, and safeguard your information when you use our booking system at 
              book.memories-studio.com and our main website at memories-studio.com.
            </p>
            <p className="text-foreground">
              We comply with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and, where applicable, 
              the EU General Data Protection Regulation (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Data Controller</h2>
            <p className="text-foreground">
              <strong>Memories Photography Studio</strong><br />
              Green Valley Field Subdivision, Buna Cerca<br />
              Indang, Cavite, Philippines<br />
              Email: smile@memories-studio.com<br />
              Phone: +63 906 469 4122
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. What Personal Data We Collect</h2>
            <p className="text-foreground">We collect the following types of personal data:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Contact Information:</strong> Name, email address, phone number</li>
              <li><strong>Booking Information:</strong> Preferred date and time, service type selected, number of people</li>
              <li><strong>Communication Data:</strong> Messages sent through our contact forms or email</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, cookies (see Cookie Policy below)</li>
              <li><strong>Payment Information:</strong> We do not store credit card details. Payment processing is handled securely by third-party payment processors</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Why We Collect Your Data (Legal Basis)</h2>
            <p className="text-foreground">We collect and process your personal data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Booking Management:</strong> To process and manage your photography session bookings (contractual necessity)</li>
              <li><strong>Communication:</strong> To send booking confirmations, reminders, and respond to inquiries (contractual necessity and legitimate interest)</li>
              <li><strong>Service Improvement:</strong> To analyze usage patterns and improve our services (legitimate interest)</li>
              <li><strong>Marketing:</strong> To send promotional materials only with your explicit consent (consent-based)</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations such as tax and accounting requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. How We Use Your Data</h2>
            <p className="text-foreground">Your personal data is used to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Create and manage your booking</li>
              <li>Send booking confirmations and reminders via email</li>
              <li>Process payments for services</li>
              <li>Communicate with you about your booking or inquiries</li>
              <li>Improve our website and booking system functionality</li>
              <li>Send marketing communications (only with your consent)</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. How We Store and Protect Your Data</h2>
            <p className="text-foreground">
              We implement appropriate technical and organizational security measures to protect your personal data against 
              unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>HTTPS encryption for all data transmission</li>
              <li>Secure cloud storage with access controls</li>
              <li>Regular security audits and updates</li>
              <li>Strict access controls - only authorized personnel can access your data</li>
              <li>Data backup and recovery procedures</li>
            </ul>
            <p className="text-foreground mt-4">
              Your data is stored on secure servers provided by Vercel, Notion, and Google Cloud Platform. 
              These providers are compliant with international security standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. How Long We Keep Your Data</h2>
            <p className="text-foreground">We retain your personal data for the following periods:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Booking Data:</strong> 3 years after your last booking for business records and tax purposes</li>
              <li><strong>Marketing Consent:</strong> Until you withdraw consent or 2 years of inactivity</li>
              <li><strong>Communication Records:</strong> 2 years after last interaction</li>
              <li><strong>Analytics Data:</strong> 26 months (Google Analytics default)</li>
            </ul>
            <p className="text-foreground mt-4">
              After these retention periods, we will securely delete or anonymize your data unless we are legally required to retain it longer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Who We Share Your Data With</h2>
            <p className="text-foreground">We may share your personal data with the following third parties:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Notion:</strong> For booking and customer database management</li>
              <li><strong>Google Calendar API:</strong> For scheduling and availability management</li>
              <li><strong>SendGrid:</strong> For sending booking confirmation and reminder emails</li>
              <li><strong>Vercel:</strong> For website hosting and performance</li>
              <li><strong>Google Analytics:</strong> For website analytics (anonymized where possible)</li>
            </ul>
            <p className="text-foreground mt-4">
              We do not sell, rent, or trade your personal data to third parties for marketing purposes. 
              All third-party processors are bound by data protection agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Your Rights Under the Philippine Data Privacy Act and GDPR</h2>
            <p className="text-foreground">You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
              <li><strong>Right to Restriction:</strong> Request limitation of processing your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for marketing purposes</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with the National Privacy Commission (Philippines) or relevant supervisory authority</li>
            </ul>
            <p className="text-foreground mt-4">
              To exercise any of these rights, please contact us at smile@memories-studio.com or +63 906 469 4122. 
              We will respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Cookie Policy</h2>
            <p className="text-foreground">
              Our website uses cookies to enhance your browsing experience and analyze site traffic. Cookies are small text files 
              stored on your device when you visit our website.
            </p>
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Types of Cookies We Use:</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Essential Cookies:</strong> Required for the website to function properly (e.g., session management, security)</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website (Google Analytics)</li>
              <li><strong>Marketing Cookies:</strong> Track your browsing activity to serve relevant advertisements (only with consent)</li>
            </ul>
            <p className="text-foreground mt-4">
              You can manage your cookie preferences through our cookie consent banner that appears on your first visit. 
              You can also disable cookies through your browser settings, though this may affect website functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. International Data Transfers</h2>
            <p className="text-foreground">
              Your data may be transferred to and processed in countries outside the Philippines, including the United States and European Union, 
              where our service providers operate. We ensure that appropriate safeguards are in place, such as:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Standard Contractual Clauses approved by the European Commission</li>
              <li>Adequacy decisions by relevant data protection authorities</li>
              <li>Privacy Shield frameworks or equivalent mechanisms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Children's Privacy</h2>
            <p className="text-foreground">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal data from children. 
              If you are a parent or guardian and believe your child has provided us with personal data, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-foreground">
              We may update this privacy policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date. 
              We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Contact Us</h2>
            <p className="text-foreground">
              If you have any questions, concerns, or requests regarding this privacy policy or how we handle your personal data, please contact us:
            </p>
            <p className="text-foreground mt-4">
              <strong>Memories Photography Studio</strong><br />
              Email: smile@memories-studio.com<br />
              Phone: +63 906 469 4122<br />
              Address: Green Valley Field Subdivision, Buna Cerca, Indang, Cavite, Philippines
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Supervisory Authority</h2>
            <p className="text-foreground">
              If you believe we have not adequately addressed your concerns, you have the right to lodge a complaint with:
            </p>
            <p className="text-foreground mt-4">
              <strong>National Privacy Commission (Philippines)</strong><br />
              Website: www.privacy.gov.ph<br />
              Email: info@privacy.gov.ph<br />
              Hotline: (+632) 8234-2228
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <a href="/" className="text-primary hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
