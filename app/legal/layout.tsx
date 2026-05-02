import Link from 'next/link';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const policies = [
    { name: 'Terms and Conditions', href: '/legal/terms-and-conditions' },
    { name: 'Privacy Policy', href: '/legal/privacy-policy' },
    { name: 'Cookie Policy', href: '/legal/cookie-policy' },
  ];

  return (
    <div className="min-h-screen bg-mugen-dark pt-24 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Sticky ToC */}
          <aside className="md:w-64 flex-shrink-0">
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-mugen-black/50 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-white mb-4">Legal</h3>
              <nav className="flex flex-col gap-2">
                {policies.map((policy) => (
                  <Link
                    key={policy.name}
                    href={policy.href}
                    className="text-white/60 hover:text-mugen-gold transition-colors text-sm py-2 px-3 rounded-lg hover:bg-white/5"
                  >
                    {policy.name}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 rounded-2xl border border-white/10 bg-mugen-black/50 p-6 md:p-10 backdrop-blur-sm shadow-xl">
            <div className="prose prose-invert prose-mugen max-w-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
