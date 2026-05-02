'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, Check } from 'lucide-react'
import { GlowButton } from './GlowButton'
import { SectionTitle } from './SectionTitle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  phone2: z.string().optional(),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  productType: z.string().min(1, 'Please select a product type'),
  designBrief: z.string().min(10, 'Please provide a design brief'),
})

type FormData = z.infer<typeof formSchema>

export function CustomOrderForm() {
  const [submitted, setSubmitted] = useState(false)
  const [fileSelected, setFileSelected] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productType: '',
    },
  })

  const productSelectItemClass = cn(
    'cursor-pointer rounded-md py-2.5 pl-3 pr-8 text-sm text-white outline-none',
    'focus:bg-mugen-crimson/40 focus:text-white',
    'data-[highlighted]:bg-mugen-crimson/35 data-[highlighted]:text-white',
    '[&_svg]:text-mugen-glow'
  )

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data)
    setSubmitted(true)
    setTimeout(() => {
      reset()
      setSubmitted(false)
      setFileSelected(false)
    }, 2000)
  }

  return (
    <section className="relative py-20 md:py-32 lg:py-40 bg-gradient-to-b from-mugen-dark to-mugen-black overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Content */}
          <div
            className="flex flex-col justify-center order-2 lg:order-1"
            data-aos="fade-right"
            data-aos-duration="850"
          >
            <SectionTitle
              title="Design Your Legend"
              japaneseSubtitle="あなたの伝説をデザインする"
              subtitle="Create your custom anime merchandise with our expert designers"
            />

            <div className="mt-8 space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-mugen-crimson flex items-center justify-center flex-shrink-0 mt-1">
                  <Check size={16} className="text-mugen-white" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-mugen-white mb-1">
                    Unlimited Revisions
                  </h4>
                  <p className="text-sm text-white/90 font-medium">
                    We&apos;ll work with you until your design is perfect
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-mugen-crimson flex items-center justify-center flex-shrink-0 mt-1">
                  <Check size={16} className="text-mugen-white" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-mugen-white mb-1">
                    Fast Turnaround
                  </h4>
                  <p className="text-sm text-white/90 font-medium">
                    Most designs completed within 5-7 business days
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-mugen-crimson flex items-center justify-center flex-shrink-0 mt-1">
                  <Check size={16} className="text-mugen-white" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-mugen-white mb-1">
                    Premium Quality
                  </h4>
                  <p className="text-sm text-white/90 font-medium">
                    High-quality printing and materials guaranteed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div
            className="order-1 lg:order-2"
            data-aos="fade-left"
            data-aos-duration="850"
            data-aos-delay="100"
          >
            <div className="glass-strong rounded-xl p-8 md:p-10">
              <h3 className="font-cinzel text-2xl font-extrabold heading-stroke-lg mb-6">
                Order Details
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block font-sans text-sm font-semibold text-mugen-white mb-2">
                    Full Name
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full px-4 py-2 bg-mugen-black/50 border border-mugen-gray rounded-lg text-mugen-white placeholder:text-white/45 focus:outline-none focus:border-mugen-crimson transition-colors"
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p className="text-xs text-mugen-crimson mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Phone 1 & 2 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-sm font-semibold text-mugen-white mb-2">
                      Phone 1
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full px-4 py-2 bg-mugen-black/50 border border-mugen-gray rounded-lg text-mugen-white placeholder:text-white/45 focus:outline-none focus:border-mugen-crimson transition-colors"
                      placeholder="10-digit number"
                    />
                    {errors.phone && (
                      <p className="text-xs text-mugen-crimson mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-sans text-sm font-semibold text-mugen-white mb-2">
                      Phone 2 (Optional)
                    </label>
                    <input
                      {...register('phone2')}
                      type="tel"
                      className="w-full px-4 py-2 bg-mugen-black/50 border border-mugen-gray rounded-lg text-mugen-white placeholder:text-white/45 focus:outline-none focus:border-mugen-crimson transition-colors"
                      placeholder="Alternative number"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block font-sans text-sm font-semibold text-mugen-white mb-2">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-4 py-2 bg-mugen-black/50 border border-mugen-gray rounded-lg text-mugen-white placeholder:text-white/45 focus:outline-none focus:border-mugen-crimson transition-colors"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-mugen-crimson mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block font-sans text-sm font-semibold text-mugen-white mb-2">
                    Address
                  </label>
                  <input
                    {...register('address')}
                    type="text"
                    className="w-full px-4 py-2 bg-mugen-black/50 border border-mugen-gray rounded-lg text-mugen-white placeholder:text-white/45 focus:outline-none focus:border-mugen-crimson transition-colors"
                    placeholder="Street address"
                  />
                  {errors.address && (
                    <p className="text-xs text-mugen-crimson mt-1">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-sm font-semibold text-mugen-white mb-2">
                      City
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      className="w-full px-4 py-2 bg-mugen-black/50 border border-mugen-gray rounded-lg text-mugen-white placeholder:text-white/45 focus:outline-none focus:border-mugen-crimson transition-colors"
                      placeholder="City"
                    />
                    {errors.city && (
                      <p className="text-xs text-mugen-crimson mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-sans text-sm font-semibold text-mugen-white mb-2">
                      State
                    </label>
                    <input
                      {...register('state')}
                      type="text"
                      className="w-full px-4 py-2 bg-mugen-black/50 border border-mugen-gray rounded-lg text-mugen-white placeholder:text-white/45 focus:outline-none focus:border-mugen-crimson transition-colors"
                      placeholder="State"
                    />
                    {errors.state && (
                      <p className="text-xs text-mugen-crimson mt-1">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Product Type — Radix select (styled dark list; native OS dropdown is white) */}
                <div>
                  <label
                    htmlFor="product-type"
                    className="block font-sans text-sm font-semibold text-mugen-white mb-2"
                  >
                    Product Type
                  </label>
                  <Controller
                    name="productType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="product-type"
                          className={cn(
                            'h-11 w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-left text-sm text-mugen-white shadow-none',
                            'focus:border-mugen-crimson focus:ring-2 focus:ring-mugen-crimson/45 focus:outline-none',
                            'data-[placeholder]:text-white/50 [&>span]:w-full [&>span]:truncate'
                          )}
                          aria-invalid={errors.productType ? true : undefined}
                        >
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          sideOffset={6}
                          className={cn(
                            'z-[200] overflow-hidden rounded-xl border border-mugen-gray/90',
                            'bg-mugen-black text-mugen-white shadow-[0_16px_48px_rgba(0,0,0,0.75)]',
                            'data-[state=open]:animate-in data-[state=closed]:animate-out'
                          )}
                        >
                          <SelectItem value="tshirt" className={productSelectItemClass}>
                            T-Shirt
                          </SelectItem>
                          <SelectItem value="hoodie" className={productSelectItemClass}>
                            Hoodie
                          </SelectItem>
                          <SelectItem value="poster" className={productSelectItemClass}>
                            Poster
                          </SelectItem>
                          <SelectItem value="jacket" className={productSelectItemClass}>
                            Jacket
                          </SelectItem>
                          <SelectItem value="figure" className={productSelectItemClass}>
                            Figure
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.productType && (
                    <p className="text-xs text-mugen-crimson mt-1">
                      {errors.productType.message}
                    </p>
                  )}
                </div>

                {/* Design Brief */}
                <div>
                  <label className="block font-sans text-sm font-semibold text-mugen-white mb-2">
                    Design Brief
                  </label>
                  <textarea
                    {...register('designBrief')}
                    className="w-full px-4 py-2 bg-mugen-black/50 border border-mugen-gray rounded-lg text-mugen-white placeholder:text-white/45 focus:outline-none focus:border-mugen-crimson transition-colors resize-none h-24"
                    placeholder="Describe your design idea..."
                  />
                  {errors.designBrief && (
                    <p className="text-xs text-mugen-crimson mt-1">
                      {errors.designBrief.message}
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <label className="block font-sans text-sm font-semibold text-mugen-white mb-2">
                    Reference Files (Optional)
                  </label>
                  <label className="group flex items-center justify-center px-4 py-8 border-2 border-dashed border-mugen-crimson/40 rounded-lg cursor-pointer
                    transition-all duration-300 ease-out
                    hover:border-mugen-glow/75 hover:bg-mugen-glow/8 hover:scale-[1.01] hover:shadow-[0_0_22px_rgba(255,211,77,0.22)] active:scale-[0.99]">
                    <div className="text-center">
                      <Upload size={24} className="mx-auto text-mugen-crimson transition-colors group-hover:text-mugen-glow mb-2" />
                      <p className="font-sans text-sm text-mugen-white">
                        Click to upload or drag & drop
                      </p>
                      <p className="font-sans text-xs text-white/85 font-medium mt-1">
                        PNG, JPG or PDF (max 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={() => setFileSelected(true)}
                      accept=".png,.jpg,.jpeg,.pdf"
                    />
                  </label>
                  {fileSelected && (
                    <p className="text-xs text-mugen-gold mt-2">
                      ✓ File selected
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitted}
                  className="w-full px-6 py-3 text-base font-semibold rounded-lg cursor-pointer
                    bg-mugen-crimson text-mugen-white glow-crimson shadow-md
                    transition-all duration-300 ease-out
                    hover:glow-gold-lg hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl hover:scale-[1.01]
                    active:translate-y-0 active:scale-[0.99] active:brightness-95
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mugen-glow/75 focus-visible:ring-offset-2 focus-visible:ring-offset-mugen-black
                    disabled:opacity-50 disabled:cursor-not-allowed
                    disabled:hover:scale-100 disabled:hover:translate-y-0"
                >
                  {submitted ? 'Order Received! ✓' : 'Submit My Order'}
                </button>
              </form>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-mugen-gray/50 flex gap-4 text-xs text-white/85 font-semibold">
                <div className="text-center flex-1">
                  <p className="text-mugen-crimson">🛡️</p>
                  <p>Secure</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-mugen-crimson">💳</p>
                  <p>Multiple Methods</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-mugen-crimson">✓</p>
                  <p>100% Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-mugen-gold/5 rounded-full blur-3xl opacity-20" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-mugen-crimson/5 rounded-full blur-3xl opacity-20" />
    </section>
  )
}
