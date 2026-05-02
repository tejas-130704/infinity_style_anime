import { AlertTriangle } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Infinity',
  description: 'Terms and conditions for Infinity e-commerce platform.',
};

export default function TermsAndConditions() {
  return (
    <div className="space-y-8 text-white/80">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
          Terms and Conditions
        </h1>
        <p className="text-sm text-white/50">Last updated: May 2026</p>
      </div>

      {/* Critical Business Rules */}
      <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-6 shadow-lg shadow-amber-500/5">
        <div className="flex items-center gap-3 mb-4 text-amber-400">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="text-xl font-bold uppercase tracking-wide text-amber-400 m-0">
            Critical Business Rules
          </h2>
        </div>
        <ul className="list-disc pl-5 space-y-2 text-amber-200 font-medium">
          <li>
            Product can only be cancelled within <strong>3 hours</strong> after placing the order. After that, no cancellation or replacement will be allowed.
          </li>
          <li>
            <strong>No replacement and no return</strong> will be accepted once the product is delivered.
          </li>
          <li>
            Refund is only possible if the order is cancelled within <strong>3 hours</strong> of placing it.
          </li>
        </ul>
      </div>

      <div className="space-y-6 text-base leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">1. Introduction</h2>
          <p>
            Welcome to Infinity. These Terms and Conditions govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use our services. By using our platform, you represent and warrant that you have the legal capacity to enter into a binding agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">3. Account Responsibility</h2>
          <p>
            When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">4. Product Information Accuracy</h2>
          <p>
            We attempt to be as accurate as possible. However, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free. We reserve the right to correct any errors, inaccuracies, or omissions, and to change or update information at any time without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">5. Pricing & Payment Terms</h2>
          <p>
            All prices are subject to change without notice. We accept various forms of payment as indicated during the checkout process. By submitting payment information, you authorize us to charge the applicable payment method for the total amount of your order.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">6. Order Acceptance & Cancellation Policy</h2>
          <p>
            We reserve the right to refuse or cancel any order for any reason. As explicitly stated in our critical business rules:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Orders can only be cancelled within <strong>3 hours</strong> of placement.</li>
            <li>After this 3-hour window, no cancellations are permitted.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">7. Shipping & Delivery</h2>
          <p>
            Delivery times are estimates and are not guaranteed. We are not liable for any delays in shipments. Risk of loss and title for items purchased from us pass to you upon our delivery to the carrier.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">8. Return, Refund & Replacement Policy</h2>
          <p>
            In strict accordance with our operational policies:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>No replacements and no returns</strong> are accepted once a product has been delivered.</li>
            <li>Refunds are solely provided if an order is successfully cancelled within <strong>3 hours</strong> of the initial purchase.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">9. Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality are and will remain the exclusive property of Infinity and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">10. Limitation of Liability</h2>
          <p>
            In no event shall Infinity, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">11. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">12. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at infinity.style.anime@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
}
