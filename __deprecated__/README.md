# __deprecated__

Files moved here are **confirmed unused** in the live application.  
They are kept for reference and can be permanently deleted after a safe observation period (2–4 weeks).

**DO NOT import from this folder in production code.**

| File | Reason | Moved |
|------|--------|-------|
| `checkout/page-new.tsx` | Stale alternate checkout draft (not a Next.js route) | 2026-05-01 |
| `checkout/page-old-stripe-backup.tsx` | Stripe removed (`STRIPE_REMOVED.md`) | 2026-05-01 |
| `examples/example-with-loader.tsx` | Developer reference file, never imported | 2026-05-01 |
| `components/MarqueeSection.tsx` | Superseded by OfferMarquee (via OfferSystem) | 2026-05-01 |
| `components/GlassCard.tsx` | Never imported by any page or component | 2026-05-01 |
| `components/PosterShowcase.tsx` | Never rendered in any page | 2026-05-01 |
| `components/ThreeDModelViewer.tsx` | Never rendered; shop uses ModelViewer instead | 2026-05-01 |
| `components/CustomOrderForm.tsx` | Superseded by CustomActionFigure + PersonalizedPosters | 2026-05-01 |
| `hooks/use-toast.ts` | Duplicate of `components/ui/use-toast.ts` | 2026-05-01 |
| `hooks/use-mobile.ts` | Duplicate of `components/ui/use-mobile.tsx` | 2026-05-01 |
