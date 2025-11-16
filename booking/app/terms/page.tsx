export const metadata = {
  title: 'Terms of Service | Memories Photography Studio',
  description: 'Terms of Service for Memories Photography Studio booking system',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Effective Date:</strong> November 16, 2025<br />
            <strong>Last Updated:</strong> November 16, 2025
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
            <p className="text-foreground">
              By accessing or using the Memories Photography Studio website (memories-studio.com) and booking portal 
              (book.memories-studio.com), you agree to be bound by these Terms of Service and our Privacy Policy. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. About Us</h2>
            <p className="text-foreground">
              Memories Photography Studio is a photography studio located in Indang, Cavite, Philippines, offering 
              self-shoot and photographer-led photography sessions.
            </p>
            <p className="text-foreground mt-4">
              <strong>Business Name:</strong> Memories Photography Studio<br />
              <strong>Address:</strong> Green Valley Field Subdivision, Buna Cerca, Indang, Cavite, Philippines<br />
              <strong>Contact:</strong> smile@memories-studio.com | +63 906 469 4122
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Services Provided</h2>
            <p className="text-foreground">We offer the following photography services:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Self-Shoot Sessions:</strong> Private studio access where customers take their own photos</li>
              <li><strong>Photographer-Led Sessions:</strong> Professional photography services including pre-birthday shoots, family portraits, maternity shoots, and special event photography</li>
            </ul>
            <p className="text-foreground mt-4">
              All services must be booked in advance through our online booking system. We do not accept walk-ins.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Booking and Reservations</h2>
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">4.1 Booking Process</h3>
            <p className="text-foreground">
              To book a session, you must provide accurate and complete information including your name, email address, 
              preferred date and time, and service type. By submitting a booking, you confirm that the information provided is accurate.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">4.2 Booking Confirmation</h3>
            <p className="text-foreground">
              You will receive a booking confirmation email once your reservation is processed. Your booking is not confirmed until 
              you receive this email. Please check your spam/junk folder if you do not receive confirmation within 24 hours.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">4.3 Booking Modifications</h3>
            <p className="text-foreground">
              You may modify or reschedule your booking up to 48 hours before your scheduled session by contacting us via email 
              or phone. Modifications are subject to availability.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">4.4 Booking Authentication</h3>
            <p className="text-foreground">
              To view, modify, or cancel your booking, you will need your booking reference ID and the email address used during booking. 
              Keep this information secure and do not share it with others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Payment Terms</h2>
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">5.1 Pricing</h3>
            <p className="text-foreground">
              All prices are listed in Philippine Pesos (₱) and are subject to change. The price applicable to your booking 
              is the price displayed at the time of booking confirmation.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">5.2 Payment Methods</h3>
            <p className="text-foreground">
              We accept payment via bank transfer, GCash, PayMaya, and other payment methods as specified during the booking process. 
              Payment details will be provided in your booking confirmation email.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">5.3 Payment Security</h3>
            <p className="text-foreground">
              We use secure, PCI-compliant payment processors for all transactions. We do not store your credit card or bank account details 
              on our servers. All payment information is handled directly by our payment service providers.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">5.4 Deposit and Full Payment</h3>
            <p className="text-foreground">
              A deposit may be required to secure your booking. Full payment must be received before or on the day of your session. 
              Failure to complete payment may result in cancellation of your booking.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Cancellation and Refund Policy</h2>
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">6.1 Customer Cancellations</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>More than 7 days before session:</strong> Full refund or credit for future booking</li>
              <li><strong>3-7 days before session:</strong> 50% refund or full credit for future booking</li>
              <li><strong>Less than 3 days before session:</strong> No refund; credit may be issued at our discretion</li>
              <li><strong>No-show:</strong> No refund or credit</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">6.2 Studio Cancellations</h3>
            <p className="text-foreground">
              If we must cancel your session due to unforeseen circumstances (equipment failure, emergency, etc.), 
              you will receive a full refund or the option to reschedule at no additional cost.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">6.3 Weather and Force Majeure</h3>
            <p className="text-foreground">
              In cases of severe weather, natural disasters, government restrictions, or other force majeure events, 
              we will work with you to reschedule your session or provide a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Studio Rules and Conduct</h2>
            <p className="text-foreground">By using our studio, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Arrive on time for your scheduled session</li>
              <li>Respect studio equipment, props, and facilities</li>
              <li>Follow safety guidelines and instructions provided by staff</li>
              <li>Not exceed the maximum number of people allowed for your booked service</li>
              <li>Maintain appropriate behavior and respect other customers</li>
              <li>Not bring outside food or drinks unless explicitly permitted</li>
              <li>Not smoke or use prohibited substances on the premises</li>
            </ul>
            <p className="text-foreground mt-4">
              We reserve the right to terminate any session immediately if these rules are violated, 
              without refund or compensation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property and Usage Rights</h2>
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">8.1 Photo Ownership</h3>
            <p className="text-foreground">
              For self-shoot sessions, you retain full ownership and rights to the photos you take.
            </p>
            <p className="text-foreground mt-2">
              For photographer-led sessions, we retain the copyright to all photos. However, you are granted a license to 
              use the delivered photos for personal, non-commercial purposes.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">8.2 Marketing and Portfolio Use</h3>
            <p className="text-foreground">
              We may use photos from your session for marketing, portfolio, and promotional purposes unless you explicitly 
              opt out by notifying us in writing. If you opt out, your privacy will be respected.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">8.3 Website Content</h3>
            <p className="text-foreground">
              All content on our website, including text, images, logos, and design, is protected by copyright and may not be 
              reproduced without our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Liability and Indemnification</h2>
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">9.1 Limitation of Liability</h3>
            <p className="text-foreground">
              Memories Photography Studio shall not be liable for any indirect, incidental, special, or consequential damages 
              arising from the use of our services or website. Our total liability shall not exceed the amount paid for the service in question.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">9.2 Personal Property</h3>
            <p className="text-foreground">
              We are not responsible for loss, theft, or damage to personal belongings brought to the studio. 
              Please keep valuables secure at all times.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">9.3 Indemnification</h3>
            <p className="text-foreground">
              You agree to indemnify and hold harmless Memories Photography Studio from any claims, damages, or expenses 
              arising from your use of our services, violation of these terms, or infringement of any rights of others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Data Protection and Privacy</h2>
            <p className="text-foreground">
              We are committed to protecting your personal data in accordance with the Philippine Data Privacy Act of 2012 and 
              relevant international data protection regulations. Please review our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> 
              {' '}for detailed information on how we collect, use, and protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Social Good Initiative</h2>
            <p className="text-foreground">
              As part of our commitment to the local community, ₱5 from every booking is donated to local causes in Indang, Cavite. 
              By booking with us, you are contributing to positive change in the community.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Website Use and Restrictions</h2>
            <p className="text-foreground">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Use automated systems (bots, scrapers) to access the website</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the website</li>
              <li>Submit false or misleading booking information</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Third-Party Links and Services</h2>
            <p className="text-foreground">
              Our website may contain links to third-party websites or services. We are not responsible for the content, 
              privacy practices, or terms of these third-party sites. Use of third-party services is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Modifications to Terms</h2>
            <p className="text-foreground">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting 
              on this page. Your continued use of our services after changes are posted constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Governing Law and Dispute Resolution</h2>
            <p className="text-foreground">
              These Terms of Service are governed by the laws of the Republic of the Philippines. Any disputes arising from these 
              terms or your use of our services shall be resolved through good-faith negotiation. If negotiation fails, disputes shall 
              be subject to the exclusive jurisdiction of the courts of Indang, Cavite, Philippines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">16. Severability</h2>
            <p className="text-foreground">
              If any provision of these Terms of Service is found to be invalid or unenforceable, the remaining provisions shall 
              continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">17. Contact Information</h2>
            <p className="text-foreground">
              For questions or concerns about these Terms of Service, please contact us:
            </p>
            <p className="text-foreground mt-4">
              <strong>Memories Photography Studio</strong><br />
              Email: smile@memories-studio.com<br />
              Phone: +63 906 469 4122<br />
              Address: Green Valley Field Subdivision, Buna Cerca, Indang, Cavite, Philippines<br />
              Business Hours: Monday-Saturday 8:00 AM - 8:00 PM, Sunday 1:00 PM - 8:00 PM
            </p>
          </section>

          <section className="mt-8 p-6 bg-muted/50 rounded-lg">
            <p className="text-foreground">
              <strong>By using our website and booking our services, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms of Service and our Privacy Policy.</strong>
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
