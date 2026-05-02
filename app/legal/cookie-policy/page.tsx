import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | Infinity',
  description: 'Cookie policy explaining usage, types, and control mechanisms on Infinity.',
};

export default function CookiePolicy() {
  return (
    <div className="space-y-8 text-white/80">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
          Cookie Policy
        </h1>
        <p className="text-sm text-white/50">Last updated: May 2026</p>
      </div>

      <div className="space-y-6 text-base leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your computer, smartphone, or other device when you visit our website. They are widely used to make websites work, or work more efficiently, as well as to provide reporting information and assist with personalization.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">2. Types of Cookies We Use</h2>
          <p className="mb-4">
            We use the following categories of cookies on our platform:
          </p>
          <div className="space-y-4">
            <div className="rounded-lg bg-white/5 p-4 border border-white/10">
              <h3 className="text-lg font-bold text-mugen-gold mb-1">Essential Cookies</h3>
              <p className="text-sm">
                These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas. Without these cookies, basic functions like page navigation and shopping carts cannot be provided.
              </p>
            </div>
            
            <div className="rounded-lg bg-white/5 p-4 border border-white/10">
              <h3 className="text-lg font-bold text-mugen-gold mb-1">Analytics / Performance Cookies</h3>
              <p className="text-sm">
                These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our website for you.
              </p>
            </div>
            
            <div className="rounded-lg bg-white/5 p-4 border border-white/10">
              <h3 className="text-lg font-bold text-mugen-gold mb-1">Marketing / Advertising Cookies</h3>
              <p className="text-sm">
                These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed, and in some cases selecting advertisements that are based on your interests.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">3. Purpose of Cookies</h2>
          <p className="mb-2">We utilize cookies to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Remember your login credentials and session state.</li>
            <li>Keep track of items stored in your shopping cart.</li>
            <li>Understand your preferences based on previous or current site activity.</li>
            <li>Compile aggregate data about site traffic and site interactions to offer better site experiences and tools in the future.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">4. How to Control Cookies</h2>
          <p>
            You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted. 
            As the means by which you can refuse cookies through your web browser controls vary from browser-to-browser, you should visit your browser's help menu for more information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">5. More Information</h2>
          <p>
            For more details regarding how we process your personal data and protect your privacy, please review our comprehensive{' '}
            <Link href="/legal/privacy-policy" className="text-mugen-gold hover:underline font-semibold">
              Privacy Policy
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
