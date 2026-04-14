'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Sparkles, Target, Heart, Star, Send, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
// BRAND_LOGO_PNG_SRC removed — hero now uses Navbar logo identity

/* ─── Visual Gallery Images ─── */
const GALLERY = [
  {
    src: 'https://m.media-amazon.com/images/I/91Gpp-eutgL._AC_UF894%2C1000_QL80_.jpg',
    alt: 'Anime Poster – Premium archival quality',
    label: 'Anime Posters',
  },
  {
    src: 'https://images.surferseo.art/e8b50a63-bda0-4a47-a59b-3680966a7fd7.jpeg',
    alt: 'Anime Action Figure – Custom 3D printed',
    label: 'Action Figures',
  },
  {
    src: 'https://cdn.dribbble.com/userupload/16031810/file/original-eb7cab412a0577a92824541a56233786.png?resize=400x0',
    alt: 'Anime Limited Edition Art – Exclusive drops',
    label: 'Limited Edition',
  },
  {
    src: 'https://cdn.dribbble.com/userupload/34791234/file/original-04b5e1d7096629f0aaf33b42e96673a5.png?format=webp&resize=400x300&vertical=center',
    alt: 'Anime Collectible Design – Unique merch',
    label: 'Collectibles',
  },
]

/* ─── Mission points ─── */
const MISSION = [
  {
    icon: Sparkles,
    title: 'Born from Passion',
    desc: 'We started because we were anime fans first. Every product begins with a question: "Would I want this on my shelf?"',
  },
  {
    icon: Target,
    title: 'Unmissable Quality',
    desc: 'Archival inks, premium resin, and curated concept art. We obsess over materials so you don\'t have to.',
  },
  {
    icon: Heart,
    title: 'Fan-First Always',
    desc: 'No generic mass-market filler. Every drop — posters, action figures, Limited Edition — is made by fans, for fans.',
  },
]

export default function AboutPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [feedbackForm, setFeedbackForm] = useState({ name: '', rating: 0, feedback: '' })
  const [contactSent, setContactSent] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault()
    setContactSent(true)
  }
  const handleFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackSent(true)
  }

  return (
    <>
      <style>{`
        /* ── Shared card glass ── */
        .about-glass {
          background: rgba(34,32,31,0.60);
          backdrop-filter: blur(22px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1.25rem;
        }

        /* ── Hero banner ── */
        .hero-banner {
          position: relative;
          overflow: hidden;
          border-radius: 1.75rem;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(184,77,122,0.22), transparent 60%),
            radial-gradient(ellipse 60% 50% at 100% 80%, rgba(134,56,65,0.18), transparent 55%),
            radial-gradient(ellipse 50% 45% at 0% 20%, rgba(198,168,108,0.10), transparent 55%),
            linear-gradient(160deg, #1c1a18 0%, #22201f 50%, #1a1817 100%);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .hero-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.012) 40px,
            rgba(255,255,255,0.012) 41px
          );
          pointer-events: none;
        }

        /* ── Input fields ── */
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 0.625rem;
          padding: 0.7rem 1rem;
          font-size: 0.875rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.22); }
        .input-field:focus {
          border-color: rgba(134,56,65,0.60);
          box-shadow: 0 0 0 3px rgba(134,56,65,0.15);
        }

        .label-sm {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: rgba(255,255,255,0.38);
          margin-bottom: 0.4rem;
          display: block;
        }

        /* ── Submit button ── */
        .submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, rgba(134,56,65,0.90), rgba(184,77,122,0.75));
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 2rem;
          font-family: 'Cinzel Decorative', serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #fff;
          cursor: pointer;
          transition: opacity 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .submit-btn:hover {
          opacity: 0.92;
          box-shadow: 0 0 28px rgba(134,56,65,0.50);
          transform: translateY(-1px);
        }
        .submit-btn:active { transform: translateY(0); }

        /* ── Section divider ── */
        .section-divider {
          border: none; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(184,77,122,0.25), transparent);
          margin: 4rem 0;
        }

        /* ── Gallery image card ── */
        .gallery-card {
          position: relative;
          overflow: hidden;
          border-radius: 1.1rem;
          border: 1px solid rgba(255,255,255,0.07);
          aspect-ratio: 3/4;
          background: #1a1817;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .gallery-card:hover {
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0 20px 50px rgba(134,56,65,0.35);
        }
        .gallery-card .gallery-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .gallery-card:hover .gallery-image { transform: scale(1.06); }
        .gallery-label {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 0.75rem 1rem;
          background: linear-gradient(to top, rgba(22,20,19,0.90), transparent);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.80);
        }

        /* ── Star button ── */
        .star-btn { cursor: pointer; transition: transform 0.12s; line-height: 1; background: none; border: none; padding: 0; }
        .star-btn:hover { transform: scale(1.25); }

        /* ── Fade-up entrance ── */
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up   { animation: fade-up 0.55s ease both; }
        .delay-1   { animation-delay: 0.10s; }
        .delay-2   { animation-delay: 0.20s; }
        .delay-3   { animation-delay: 0.30s; }
        .delay-4   { animation-delay: 0.40s; }

        /* ── Responsive: stack forms ── */
        @media (max-width: 767px) {
          .forms-grid { grid-template-columns: 1fr !important; }
          .gallery-grid { grid-template-columns: 1fr 1fr !important; }
          .mission-grid { grid-template-columns: 1fr !important; }
          .hero-text h1 { font-size: 2.2rem !important; }
        }
        @media (max-width: 480px) {
          .gallery-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <main className="min-h-screen bg-mugen-black pt-24 pb-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">

          {/* ══════════════════════════════════════════
              1. HERO SECTION
          ══════════════════════════════════════════ */}
          <section aria-labelledby="about-hero" className="hero-banner px-6 py-20 md:py-28 mb-0 text-center fade-up">
            {/* ── Brand identity — matches Navbar, scaled for hero ── */}
            <div className="mb-8 flex flex-col items-center fade-up">
              {/* Infinity logo image */}
              <div>
                <Image
                  src="/assests/logo/logo.png"
                  alt="Infinity Style Logo"
                  width={120}
                  height={120}
                  className="h-20 w-20 rounded-xl object-contain sm:h-[100px] sm:w-[100px] md:h-[120px] md:w-[120px]"
                  priority
                />
              </div>

              {/* Brand name text — exact Navbar styles, scaled up */}
              <div className="flex flex-col items-center leading-tight">
                <span className="font-cinzel text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                  Infinity Style
                </span>
                <span className="font-sans text-xs font-medium tracking-wide text-white/55 sm:text-sm">
                  by 3DKalakaar
                </span>
              </div>
            </div>

            {/* Eyebrow */}
            <span className="inline-block mb-4 rounded-full border border-mugen-crimson/40 bg-mugen-crimson/15 px-4 py-1 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-mugen-crimson/90">
              Anime Merch · Est. 2021
            </span>

            <h1
              id="about-hero"
              className="hero-text font-cinzel text-5xl font-bold text-white md:text-6xl lg:text-7xl mb-5 leading-tight"
              style={{ textShadow: '0 0 60px rgba(184,77,122,0.25)' }}
            >
              About Us
            </h1>

            <p className="mx-auto max-w-2xl text-base text-white/60 leading-relaxed md:text-lg">
              We are a team of anime fans who turned a passion for incredible stories into a platform for merchandise worthy of the worlds we love — posters, action figures, limited drops, and custom creations, all crafted with obsessive care.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-xl bg-mugen-crimson/80 px-7 py-3 font-cinzel text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-mugen-crimson hover:shadow-[0_0_28px_rgba(134,56,65,0.5)]"
              >
                Explore the Shop <ArrowRight size={15} />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3 font-cinzel text-sm font-bold uppercase tracking-widest text-white/80 transition-all hover:bg-white/10 hover:text-white"
              >
                Contact Us
              </a>
            </div>

            {/* Stats row */}
            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl mx-auto">
              {[
                { num: '10K+', label: 'Orders Delivered' },
                { num: '50+',  label: 'Limited Drops' },
                { num: '4.9★', label: 'Avg. Rating' },
                { num: '2021', label: 'Est. in Mumbai' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/06 bg-white/04 px-4 py-5">
                  <div className="font-cinzel text-2xl font-bold text-mugen-crimson/90">{s.num}</div>
                  <div className="mt-1 text-xs text-white/40">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          <hr className="section-divider" />

          {/* ══════════════════════════════════════════
              2. OUR MISSION
          ══════════════════════════════════════════ */}
          <section aria-labelledby="mission-heading" className="mb-0">
            <div className="text-center mb-10 fade-up">
              <span className="inline-block mb-3 rounded-full border border-mugen-crimson/35 bg-mugen-crimson/10 px-4 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-mugen-crimson/80">
                Our Mission
              </span>
              <h2
                id="mission-heading"
                className="font-cinzel text-3xl font-bold text-white md:text-4xl"
              >
                Why We Exist
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-white/50 leading-relaxed">
                It started with a wall — a bedroom covered in anime printouts that kept fading and curling. We wanted posters that lasted, figures that felt like the show. We couldn&apos;t find them. So we built them.
              </p>
            </div>

            <div className="mission-grid grid gap-5 sm:grid-cols-3">
              {MISSION.map((m, i) => (
                <div
                  key={m.title}
                  className={`about-glass p-8 flex flex-col gap-4 fade-up delay-${i + 1} group hover:border-mugen-crimson/25 transition-all duration-300`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mugen-crimson/15 group-hover:bg-mugen-crimson/25 transition-colors">
                    <m.icon className="h-6 w-6 text-mugen-crimson/85" />
                  </span>
                  <h3 className="font-cinzel text-base font-bold text-white">{m.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <hr className="section-divider" />

          {/* ══════════════════════════════════════════
              3. VISUAL GALLERY
          ══════════════════════════════════════════ */}
          <section aria-labelledby="gallery-heading" className="mb-0">
            <div className="text-center mb-10 fade-up">
              <span className="inline-block mb-3 rounded-full border border-mugen-crimson/35 bg-mugen-crimson/10 px-4 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-mugen-crimson/80">
                Our Products
              </span>
              <h2
                id="gallery-heading"
                className="font-cinzel text-3xl font-bold text-white md:text-4xl"
              >
                What We Make
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-white/50 leading-relaxed">
                From hand-curated archival posters to full-detail custom action figures — every item is designed for serious anime fans.
              </p>
            </div>

            <div className="gallery-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {GALLERY.map((item, i) => (
                <div key={item.label} className={`gallery-card fade-up delay-${Math.min(i + 1, 4)}`}>
                  <div className="relative h-full w-full">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="gallery-image"
                      sizes="(max-width: 640px) 50vw, 25vw"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc+UGdBV1lZWV1fWFlaY2Nja2NjY2P/2wBDAQ4QERQZKRIkZGRlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVl/wAARCAAFAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwB//9k="
                      onError={(e) => {
                        const el = e.currentTarget
                        el.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="gallery-label">{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          <hr className="section-divider" />

          {/* ══════════════════════════════════════════
              4. CONTACT US + 5. FEEDBACK FORM
          ══════════════════════════════════════════ */}
          <section id="contact" aria-labelledby="contact-heading" className="mb-0 scroll-mt-28">
            <div className="text-center mb-10 fade-up">
              <span className="inline-block mb-3 rounded-full border border-mugen-crimson/35 bg-mugen-crimson/10 px-4 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-mugen-crimson/80">
                Get in Touch
              </span>
              <h2
                id="contact-heading"
                className="font-cinzel text-3xl font-bold text-white md:text-4xl"
              >
                Talk To Us
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-white/50 leading-relaxed">
                Questions, collabs, or just want to talk anime? Drop us a message — we read every single one.
              </p>
            </div>

            <div className="forms-grid grid gap-6 md:grid-cols-2">

              {/* ── Contact Us ── */}
              <div className="about-glass p-7 flex flex-col gap-5 fade-up delay-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mugen-crimson/15">
                    <Mail className="h-5 w-5 text-mugen-crimson/80" />
                  </span>
                  <div>
                    <h3 className="font-cinzel text-lg font-bold text-white leading-tight">Contact Us</h3>
                    <p className="text-xs text-white/35 mt-0.5">We reply within 24 hours</p>
                  </div>
                </div>

                {contactSent ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
                    <span className="text-5xl">✅</span>
                    <p className="font-semibold text-white/85 mt-2">Message sent!</p>
                    <p className="text-xs text-white/40">We&apos;ll reply to your email within 24 hours.</p>
                    <button
                      className="mt-3 text-xs text-mugen-crimson/70 underline underline-offset-2 hover:text-mugen-crimson"
                      onClick={() => { setContactSent(false); setContactForm({ name: '', email: '', message: '' }) }}
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContact} className="flex flex-col gap-4" noValidate>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="contact-name" className="label-sm">Name</label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          placeholder="Your name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="label-sm">Email</label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          placeholder="your@email.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="input-field"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="label-sm">Message</label>
                      <textarea
                        id="contact-message"
                        rows={6}
                        required
                        placeholder="Tell us anything — questions, collabs, feedback..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="input-field resize-none"
                      />
                    </div>
                    <button type="submit" className="submit-btn self-start">
                      <Send size={14} />
                      Send Message
                    </button>
                  </form>
                )}
              </div>

              {/* ── Feedback ── */}
              <div className="about-glass p-7 flex flex-col gap-5 fade-up delay-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mugen-crimson/15">
                    <MessageSquare className="h-5 w-5 text-mugen-crimson/80" />
                  </span>
                  <div>
                    <h3 className="font-cinzel text-lg font-bold text-white leading-tight">Leave Feedback</h3>
                    <p className="text-xs text-white/35 mt-0.5">Help us improve</p>
                  </div>
                </div>

                {feedbackSent ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
                    <span className="text-5xl">🙏</span>
                    <p className="font-semibold text-white/85 mt-2">Thank you!</p>
                    <p className="text-xs text-white/40">Your feedback means the world and helps us ship better products.</p>
                    <button
                      className="mt-3 text-xs text-mugen-crimson/70 underline underline-offset-2 hover:text-mugen-crimson"
                      onClick={() => { setFeedbackSent(false); setFeedbackForm({ name: '', rating: 0, feedback: '' }) }}
                    >
                      Submit again
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFeedback} className="flex flex-col gap-4" noValidate>
                    <div>
                      <label htmlFor="fb-name" className="label-sm">
                        Name <span style={{ color: 'rgba(255,255,255,0.22)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                      </label>
                      <input
                        id="fb-name"
                        type="text"
                        placeholder="Your name"
                        value={feedbackForm.name}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    {/* Star Rating */}
                    <div>
                      <span className="label-sm">Your Rating</span>
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const filled = star <= (hoverRating || feedbackForm.rating)
                          return (
                            <button
                              key={star}
                              type="button"
                              className="star-btn"
                              onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                              id={`star-btn-${star}`}
                            >
                              <Star
                                size={28}
                                className={
                                  filled
                                    ? 'text-mugen-gold fill-mugen-gold transition-colors'
                                    : 'text-white/20 transition-colors'
                                }
                              />
                            </button>
                          )
                        })}
                        {feedbackForm.rating > 0 && (
                          <span className="ml-2 text-xs text-white/35">
                            {feedbackForm.rating}/5
                          </span>
                        )}
                      </div>
                      {feedbackForm.rating === 0 && (
                        <p className="mt-1 text-[0.65rem] text-white/25">Click a star to rate</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="fb-feedback" className="label-sm">Your Feedback</label>
                      <textarea
                        id="fb-feedback"
                        rows={6}
                        required
                        placeholder="What did you love? What can we do better?"
                        value={feedbackForm.feedback}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                        className="input-field resize-none"
                      />
                    </div>

                    <button type="submit" className="submit-btn self-start">
                      <MessageSquare size={14} />
                      Submit Feedback
                    </button>
                  </form>
                )}
              </div>

            </div>
          </section>

          <hr className="section-divider" />

          {/* Bottom CTA */}
          <div className="text-center fade-up">
            <p className="text-sm text-white/35 mb-4">Ready to explore?</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-mugen-crimson/80 px-8 py-3.5 font-cinzel text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-mugen-crimson hover:shadow-[0_0_28px_rgba(134,56,65,0.50)]"
            >
              Explore the Shop <ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </main>
    </>
  )
}
