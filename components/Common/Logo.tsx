import Image from 'next/image'

interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 50, className = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Image
        src="/logo.png"
        alt="Logo"
        width={size}
        height={size}
        className="drop-shadow-lg object-contain"
        priority
      />
    </div>
  )
}
