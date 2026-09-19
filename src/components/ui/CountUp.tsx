'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
}

export default function CountUp({ end, duration = 2000, suffix = '', prefix = '', className = '' }: Props) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const step = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(ease * end))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString('fr-FR')}{suffix}
    </span>
  )
}
