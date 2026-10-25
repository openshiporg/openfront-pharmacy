import Image from 'next/image'

/** Product photo, or a label tile with the product's own name when there is no photo. */
export function ProductImage({ src, alt, sizes, className = 'object-cover', fallbackLabel }: { src?: string | null; alt: string; sizes: string; className?: string; fallbackLabel?: string | null }) {
  if (!src) return <div className="flex size-full flex-col justify-between p-5 text-foreground sm:p-6">
    <span aria-hidden="true" className="text-[2rem] font-bold leading-none text-primary">℞</span>
    {fallbackLabel && <span aria-hidden="true" className="line-clamp-3 text-[1.0625rem] font-bold leading-[1.15] tracking-[-0.01em]">{fallbackLabel}</span>}
  </div>
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} />
}
