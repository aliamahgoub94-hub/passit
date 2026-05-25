import Link from 'next/link'

export function Logo({ href = '/', size = 'md' }: { href?: string; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  const textSize = size === 'sm' ? 'text-base' : 'text-xl'

  return (
    <Link href={href} className="flex items-center gap-2.5 no-underline">
      <div className={`${iconSize} bg-gradient-to-br from-[#2563eb] to-[#0f1f47] rounded-[9px] flex items-center justify-center font-black text-white tracking-tight`}
           style={{ fontFamily: 'var(--font-bricolage)' }}>
        P!
      </div>
      <span className={`${textSize} font-extrabold text-[#0f1f47] tracking-tight`}
            style={{ fontFamily: 'var(--font-bricolage)' }}>
        Pass<span className="text-[#f97316]">it</span>
      </span>
    </Link>
  )
}
