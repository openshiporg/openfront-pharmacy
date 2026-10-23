import Image from 'next/image'

/** Product photo, or a label tile with the product's own name when there is no photo. */
export function ProductImage({ src, alt, sizes, className = 'object-cover', fallbackLabel }: { src?: string | null; alt: string; sizes: string; className?: string; fallbackLabel?: string | null }) {
  if (!src) return <div className="flex size-full flex-col justify-between bg-accent p-4 text-accent-foreground">
    <span aria-hidden="true" className="rx-num text-lg leading-none opacity-70">℞</span>
    {fallbackLabel && <span aria-hidden="true" className="line-clamp-3 text-sm font-semibold leading-snug">{fallbackLabel}</span>}
  </div>
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} />
}
