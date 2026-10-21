import Image from 'next/image'
import { Package } from 'lucide-react'

export function ProductImage({ src, alt, sizes, className = 'object-cover' }: { src?: string | null; alt: string; sizes: string; className?: string }) {
  if (!src) return <div className="grid size-full place-items-center bg-muted"><Package aria-hidden="true" className="size-8 text-muted-foreground" /></div>
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} />
}
