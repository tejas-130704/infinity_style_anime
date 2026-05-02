import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Infinity',
  description: 'Privacy policy for Infinity e-commerce platform detailing data collection and usage.',
};

export default function PrivacyPolicy() {
  return (
    <div className="space-y-8 text-white/80">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-white/50">Last updated: May 2026</p>
      </div>

      <div className="space-y-6 text-base leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">1. Information We Collect</h2>
          <p className="mb-2">
            We collect information to provide better services to our users. The types of personal information we may collect include:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal Identity Information:</strong> Name, email address, phone number.</li>
            <li><strong>Payment Information:</strong> Credit card details, billing address, and transaction history (processed securely by our payment gateways).</li>
            <li><strong>Shipping Details:</strong> Delivery address and related contact details.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage statistics.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">2. How We Use Your Data</h2>
          <p className="mb-2">We use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>To process your transactions and manage your orders.</li>
            <li>To communicate with you regarding order updates, customer support, and promotional offers.</li>
            <li>To improve our platform, user experience, and overall service quality.</li>
            <li>To detect, prevent, and address technical issues or fraudulent activities.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">3. Data Protection & Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information. Your personal data is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems, and are required to keep the information confidential. All sensitive/credit information you supply is encrypted via Secure Socket Layer (SSL) technology.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">4. Third-Party Services</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties unless we provide users with advance notice. This does not include website hosting partners, payment gateways (such as Razorpay or Stripe), and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">5. Cookies Usage</h2>
          <p>
            Our platform uses "cookies" to enhance your user experience, track preferences, and analyze site traffic. For detailed information on how we use cookies and how you can manage your preferences, please refer to our <a href="/legal/cookie-policy" className="text-mugen-gold hover:underline">Cookie Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">6. User Rights</h2>
          <p className="mb-2">Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request that we correct any inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request that we delete your personal data under certain conditions.</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, please contact us using the information below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">7. Contact Information</h2>
          <p>
            If you have any questions or concerns regarding this Privacy Policy, please contact our Data Protection Officer at privacy@infinity.com.
          </p>
        </section>
      </div>
    </div>
  );
}
