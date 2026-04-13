import Link from 'next/link'
import { Mail, Phone, MapPin, Github, Twitter, Instagram, Infinity as InfinityMark } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Shop',                  href: '/shop' },
  { label: 'Posters',               href: '/shop?category=posters' },
  { label: 'Action Figures',        href: '/shop?category=action_figures' },
  { label: 'Limited Edition',       href: '/shop?category=limited_edition' },
  { label: 'Custom Action Figure',  href: '/shop?category=custom_action_figure' },
  { label: 'Account',               href: '/account' },
] as const

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
  className="relative bg-mugen-black border-t border-[rgba(255,255,255,0.3)]"
  data-aos="fade-up"
  data-aos-duration="850"
>
      {/* Top Glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mugen-crimson to-transparent" />

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:px-8 md:py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-mugen-crimson via-mugen-magenta/80 to-mugen-gold shadow-md ring-1 ring-white/15"
                aria-hidden
              >
                <InfinityMark className="h-5 w-5 text-white" strokeWidth={2.4} />
              </div>
              <span className="font-cinzel text-lg font-bold tracking-tight text-white">Infinity Style</span>
            </div>
            <p className="font-sans text-sm font-medium leading-relaxed mb-6 text-white">
              Premium anime merchandise with exclusive drops and custom designs. Bringing legends to life.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                className="tap-target rounded-full bg-mugen-gray text-mugen-glow glow-gold
                  transition-all duration-300 ease-out
                  hover:bg-mugen-glow-deep hover:text-mugen-white hover:shadow-[0_0_22px_rgba(255,211,77,0.55)]
                  active:scale-95 md:hover:scale-110 md:hover:-translate-y-0.5"
                aria-label="Twitter"
              >
                <Twitter className="h-[18px] w-[18px]" aria-hidden />
              </a>
              <a
                href="#"
                className="tap-target rounded-full bg-mugen-gray text-mugen-glow glow-gold
                  transition-all duration-300 ease-out
                  hover:bg-mugen-glow-deep hover:text-mugen-white hover:shadow-[0_0_22px_rgba(255,211,77,0.55)]
                  active:scale-95 md:hover:scale-110 md:hover:-translate-y-0.5"
                aria-label="Instagram"
              >
                <Instagram className="h-[18px] w-[18px]" aria-hidden />
              </a>
              <a
                href="#"
                className="tap-target rounded-full bg-mugen-gray text-mugen-glow glow-gold
                  transition-all duration-300 ease-out
                  hover:bg-mugen-glow-deep hover:text-mugen-white hover:shadow-[0_0_22px_rgba(255,211,77,0.55)]
                  active:scale-95 md:hover:scale-110 md:hover:-translate-y-0.5"
                aria-label="GitHub"
              >
                <Github className="h-[18px] w-[18px]" aria-hidden />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-6 text-white">
              Quick Links
            </h3>
            <ul className="space-y-1">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="link-underline-anim block min-h-11 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-200 hover:text-mugen-glow sm:min-h-0 sm:py-0"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-6 text-white">
              Support
            </h3>
            <ul className="space-y-1">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Contact',  href: '/about#contact-heading' },
                { label: 'FAQ',      href: '/about#faq-heading' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="link-underline-anim block min-h-11 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-200 hover:text-mugen-glow sm:min-h-0 sm:py-0"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-6 text-white">
              Contact
            </h3>
            <div className="space-y-4">
              <a
                href="mailto:support@mugendrip.com"
                className="group flex items-start gap-3 text-sm font-medium text-white transition-colors duration-200 hover:text-mugen-glow"
              >
                <Mail size={18} className="mt-0.5 shrink-0 opacity-80 group-hover:opacity-100" aria-hidden />
                <span className="link-underline-anim">support@mugendrip.com</span>
              </a>
              <a
                href="tel:+919876543210"
                className="group flex items-start gap-3 text-sm font-medium text-white transition-colors duration-200 hover:text-mugen-glow"
              >
                <Phone size={18} className="mt-0.5 shrink-0 opacity-80 group-hover:opacity-100" aria-hidden />
                <span className="link-underline-anim">+91 (98765) 43210</span>
              </a>
              <div className="flex items-start gap-3 text-sm font-medium text-white">
                <MapPin size={18} className="flex-shrink-0 mt-0.5" />
                <span>
                  Mumbai, India
                  <br />
                  400001
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
            © {currentYear} Infinity Style. All rights reserved. Crafted with passion by anime enthusiasts.
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
