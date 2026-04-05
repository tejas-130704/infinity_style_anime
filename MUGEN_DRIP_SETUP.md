# MUGEN DRIP - Anime Merchandise E-Commerce

A premium anime merchandise e-commerce platform with advanced animations, 3D model viewer, and custom order system.

## Features

### 🎬 Advanced Animations
- **GSAP Timeline Animations**: One-time loading sequence with tear effect, hero text reveal
- **Framer Motion**: Scroll-triggered stagger animations and component transitions
- **CSS Animations**: Looping marquee, glow pulses, breathing effects
- **3D Transforms**: Poster cards with perspective tilt, smooth transitions

### 🔧 Technology Stack
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4 with custom dark luxury theme
- **Animations**: GSAP, Framer Motion
- **3D Graphics**: Three.js with @react-three/fiber & @react-three/drei
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

### 📦 Component Structure

```
components/
├── LoadingAnimation.tsx      # One-time loading with tear effect
├── Navbar.tsx               # Floating glassmorphic navbar
├── HeroSection.tsx          # Full-width hero with video background
├── ValueProposition.tsx      # 4 value cards with hover effects
├── PosterShowcase.tsx        # Horizontal scroll poster carousel
├── ThreeDModelViewer.tsx     # Interactive 3D character viewer
├── CustomOrderForm.tsx       # Form with file upload & validation
├── MarqueeSection.tsx        # Infinite scrolling marquee
├── Footer.tsx               # Footer with social links
├── GlassCard.tsx            # Reusable glassmorphic card
├── GlowButton.tsx           # Button with crimson glow
└── SectionTitle.tsx         # Consistent heading component
```

## Setup Instructions

### 1. Install Dependencies
Dependencies are automatically installed. Key packages:
- `gsap` - Timeline animations
- `framer-motion` - Scroll animations
- `three` - 3D graphics
- `@react-three/fiber` - React wrapper for Three.js
- `@react-three/drei` - Three.js utilities
- `lenis` - Smooth scroll (optional)

### 2. Required Assets

Place these files in `/public/`:

#### Videos & Images
- `infinity-castle.mp4` - Hero background video
- `zenitsu-loading.gif` - Loading screen animation

#### 3D Models
Place .glb files in `/public/models/`:
- `tanjiro.glb`
- `zenitsu.glb`
- `inosuke.glb`
- `giyu.glb`
- `rengoku.glb`
- `nezuko.glb`

**Note**: Currently using placeholder gradients/SVGs. Replace with actual assets.

### 3. Configuration

#### Tailwind Theme
Colors defined in `tailwind.config.ts`:
- `mugen-black`: #0A0A0A
- `mugen-crimson`: #C0151A
- `mugen-gold`: #D4AF37
- `mugen-white`: #FFFFFF

#### Fonts
- **Headings**: Cinzel Decorative (var(--font-cinzel))
- **Japanese Text**: Noto Sans JP (var(--font-noto-jp))
- **Body**: DM Sans (var(--font-dm-sans))

### 4. Environment Setup

No API keys required for MVP. For production, add:
- **Razorpay Keys** (Payment processing)
- **Email Service** (Form submissions)
- **Analytics** (Vercel Analytics already included)

## Animation Details

### Loading Animation
- Zenitsu GIF with breathing glow pulse (GSAP)
- Lightning progress bar (2.5s duration)
- Tear effect: screen splits into left/right halves
- Stored in sessionStorage to show only once per session

### Hero Section
- GSAP text reveal: words slide up with stagger
- Eyebrow tag, main title, subtitle, CTA buttons
- Video background with gradient overlay

### Value Proposition
- 4 cards with intersection observer
- Stagger animation on scroll (100ms delay between cards)
- Glassmorphic backgrounds with glow on hover

### Poster Showcase
- Horizontal scroll with mouse tilt effect
- 3D perspective transformation on hover
- Shimmer effect on hover
- Navigation arrows with smooth scrolling

### 3D Model Viewer
- Six interactive characters with OrbitControls
- Fade transition between models (GSAP)
- Floating particles (Three.js Points)
- Sliding indicator for character selection

### Custom Order Form
- Form validation with Zod schema
- File upload with preview
- Responsive two-column layout
- Success state with 2s auto-reset

### Marquee Section
- Two rows scrolling in opposite directions
- 40s animation duration for smooth loop
- Hover effects on text

## Performance Optimizations

- Lazy loading for 3D models via Suspense
- Intersection Observer for scroll-triggered animations
- CSS animations for looping effects (no JS re-renders)
- Image optimization via Next.js
- Debounced scroll detection in navbar

## Responsive Design

- **Mobile**: Stacked layouts, hamburger menu, hidden hero video
- **Tablet**: 2-column grids, adjusted font sizes
- **Desktop**: Full features, floating elements, hover effects

Mobile-first approach with progressive enhancement.

## Custom Styling

### Glassmorphism
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Glow Effects
```css
.glow-crimson {
  box-shadow: 0 0 20px rgba(192, 21, 26, 0.5);
}
```

### Text Animations
Available Tailwind classes:
- `animate-glow-pulse` - Breathing glow
- `animate-breathe` - Scale breathing
- `animate-shimmer` - Gradient shimmer
- `animate-marquee` - Horizontal scroll
- `animate-float` - Vertical float

## Form Validation

Using Zod schema with React Hook Form:
- Name (2+ chars)
- Phone (10 digits)
- Email (valid format)
- Address (5+ chars)
- City/State (2+ chars)
- Product Type (required)
- Design Brief (10+ chars)

## Future Enhancements

- [ ] Razorpay payment integration
- [ ] Backend form submission to database
- [ ] Email notifications
- [ ] User authentication
- [ ] Cart functionality
- [ ] Real 3D models (GLB files)
- [ ] Video streaming optimization
- [ ] Analytics dashboard

## Troubleshooting

### 3D Models Not Loading
- Ensure .glb files exist in `/public/models/`
- Check browser console for CORS errors
- Use fallback box geometry if models unavailable

### Animations Choppy
- Disable browser extensions
- Clear cache and hard refresh (Ctrl+Shift+R)
- Check GPU acceleration in browser settings

### Form Not Submitting
- Check browser console for validation errors
- Ensure all required fields are filled
- Verify Zod schema matches form fields

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Environment variables: (none required for MVP)
3. Deploy button will build and deploy automatically

### Local Development
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## File Structure

```
/vercel/share/v0-project/
├── app/
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Main home page
│   └── globals.css          # Global styles & animations
├── components/              # All React components
├── public/                  # Static assets
│   ├── models/             # 3D model files
│   ├── infinity-castle.mp4 # Hero video
│   └── zenitsu-loading.gif # Loading animation
├── tailwind.config.ts       # Theme configuration
├── next.config.mjs          # Next.js config
└── package.json             # Dependencies
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Color Palette Reference

- **Primary**: Mugen Crimson (#C0151A) - Bold, energetic
- **Accent**: Mugen Gold (#D4AF37) - Premium, elegant
- **Background**: Mugen Black (#0A0A0A) - Deep, immersive
- **Text**: Mugen White (#FFFFFF) - High contrast

## License

© 2024 MUGEN DRIP. All rights reserved.

---

**Last Updated**: March 2026
**Status**: Production Ready
**Version**: 1.0.0
