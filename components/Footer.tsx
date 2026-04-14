import Link from 'next/link'
import Image from 'next/image'
import { Mail, MapPin, Instagram } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Posters', href: '/shop?category=posters' },
  { label: 'Action Figures', href: '/shop?category=action_figures' },
  { label: 'Limited Edition', href: '/shop?category=limited_edition' },
  { label: 'Custom Action Figure', href: '/shop?category=custom_action_figure' },
  { label: 'Account', href: '/account' },
] as const

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-mugen-black border-t border-[rgba(255,255,255,0.3)]">

      {/* Top Glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mugen-crimson to-transparent" />

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:px-8 md:py-12">

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12 text-center md:text-left">

          {/* COMPANY */}
          <div>
            <div className="mb-4 flex flex-col items-center md:flex-row gap-3">
              <Image
                src="/assests/logo/logo.png"
                alt="Infinity Style Logo"
                width={48}
                height={48}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-contain"
              />
              <div className="flex flex-col leading-tight items-center md:items-start">
                <span className="font-cinzel text-lg font-bold text-white">
                  Infinity Style
                </span>
                <span className="text-xs text-white/55">
                  by 3DKalakaar
                </span>
              </div>
            </div>

            <p className="text-sm text-white mb-6 text-center md:text-left">
              Premium anime merchandise with exclusive drops and custom designs. Bringing legends to life.
            </p>

            {/* Instagram Button */}
            <div className="flex justify-center md:justify-start">
              <a
                href="https://www.instagram.com/3dkalakaar.in"
                className="relative overflow-hidden inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/30 text-white group"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-[#feda75] via-[#fa7e1e] to-[#d62976] transition-transform duration-500 group-hover:translate-x-0" />
                <span className="relative z-10 flex items-center gap-2">
                  <Instagram className="h-5 w-5" />
                  <span className="text-sm font-medium">Instagram</span>
                </span>
              </a>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-6 text-white">
              Quick Links
            </h3>

            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 justify-items-center md:flex md:flex-col md:items-start md:space-y-1">
              {QUICK_LINKS.map((link) => (
                <li key={link.href} className="md:text-left">
                  <Link
                    href={link.href}
                    className="link-underline-anim inline-block text-sm text-white transition-colors duration-200 hover:text-mugen-glow"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>



          {/* SUPPORT */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-6 text-white">
              Support
            </h3>

            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 justify-items-center md:flex md:flex-col md:items-start md:space-y-1">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Contact', href: '/about#contact-heading' },
                { label: 'FAQ', href: '/about#faq-heading' },
              ].map((link) => (
                <li key={link.label} className="md:text-left bg-transparent">
                  <Link
                    href={link.href}
                    className="link-underline-anim inline-block text-sm text-white transition-colors duration-200 hover:text-mugen-glow"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-6 text-white">
              Contact
            </h3>

            <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left">

              <a
                href="mailto:infinity.style.anime@gmail.com"
                className="flex items-center gap-3"
              >
                <Mail size={18} />
                <span>infinity.style.anime@gmail.com</span>
              </a>

              <div className="flex items-center gap-3">
                <MapPin size={18} />
                <span>
                  Chh. Sambhaji Nagar, Maharashtra, India
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[rgba(255,255,255,0.3)] mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <p className="font-sans text-sm font-medium text-center text-white md:text-left">
            © {currentYear} Infinity Style. All rights reserved by 3DKalakaar. Crafted with passion by anime enthusiasts.
          </p>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-sans text-sm font-medium text-white md:justify-end">
            <a
              href="#"
              className="link-underline-anim min-h-11 py-2 text-white transition-colors duration-200 hover:text-mugen-glow sm:min-h-0"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="link-underline-anim min-h-11 py-2 text-white transition-colors duration-200 hover:text-mugen-glow sm:min-h-0"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="link-underline-anim min-h-11 py-2 text-white transition-colors duration-200 hover:text-mugen-glow sm:min-h-0"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mugen-crimson to-transparent" />
    </footer>
  )
}