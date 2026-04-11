import { useLayoutEffect, useRef } from 'react'
import { getSvgPath } from 'figma-squircle'

/**
 * G2-continuous (curvature-continuous) rounded container.
 * Drop-in replacement for any div that would otherwise use border-radius.
 * Uses figma-squircle to generate the clip path, updated via ResizeObserver.
 */
export default function Squircle({
  children,
  radius = 18,
  smoothing = 0.4,
  as: Tag = 'div',
  className,
  style,
  ...props
}) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const { offsetWidth: width, offsetHeight: height } = el
      if (!width || !height) return
      const path = getSvgPath({
        width,
        height,
        cornerRadius: radius,
        cornerSmoothing: smoothing,
      })
      el.style.clipPath = `path('${path}')`
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [radius, smoothing])

  return (
    <Tag ref={ref} className={className} style={style} {...props}>
      {children}
    </Tag>
  )
}
