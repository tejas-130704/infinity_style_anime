interface SectionTitleProps {
  title: string
  subtitle?: string
  japaneseSubtitle?: string
  className?: string
  centered?: boolean
}

export function SectionTitle({
  title,
  subtitle,
  japaneseSubtitle,
  className = '',
  centered = false,
}: SectionTitleProps) {
  return (
    <div className={centered ? 'text-center' : ''}>
      <h2
        className={`
        font-cinzel text-[clamp(1.5rem,4.5vw,3.5rem)] sm:text-3xl md:text-4xl lg:text-5xl font-extrabold
        heading-stroke mb-2
        text-balance
        ${className}
      `}
      >
        {title}
      </h2>
      {japaneseSubtitle && (
        <p className="font-noto-jp text-sm md:text-base text-white/90 font-semibold mb-4 tracking-wide">
          {japaneseSubtitle}
        </p>
      )}
      {subtitle && (
        <p
          className={`font-sans text-base md:text-lg font-medium md:font-semibold max-w-2xl ${
            centered ? 'text-white/90 mx-auto' : 'text-white/90'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
