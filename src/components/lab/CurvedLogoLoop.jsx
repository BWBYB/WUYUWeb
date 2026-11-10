import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import AsciiLogo from './AsciiLogo'
import './CurvedLogoLoop.css'

const VIEW_W = 1200
const VIEW_H = 380
const TILE_W = 176
const TILE_H = 200
const PATH_D = 'M -240,180 Q 600,360 1440,180'
const MAX_FLING = 4000

const wrapOffset = (value, length) => (length > 0 ? ((value % length) + length) % length : 0)

export default function CurvedLogoLoop({
  logos,
  slots = null,
  speed = 1,
  direction = 'left',
  interactive = true,
  pauseOnHover = true,
  label = '技术栈 ASCII 徽标沿曲线循环',
}) {
  const slotCount = Math.min(slots ?? logos.length, logos.length)
  const stageRef = useRef(null)
  const worldRef = useRef(null)
  const pathRef = useRef(null)
  const tileRefs = useRef([])
  const offsetRef = useRef(0)
  const velocityRef = useRef(0)
  const hoverRef = useRef(false)
  const directionRef = useRef(direction)
  const settingsRef = useRef({ speed, pauseOnHover })
  const dragRef = useRef({ active: false, x: 0, time: 0, scale: 1, velocity: 0 })
  const reduceRef = useRef(false)

  const [pathLength, setPathLength] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [slotIndexes, setSlotIndexes] = useState(() =>
    Array.from({ length: slotCount }, (_, index) => index),
  )

  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  useEffect(() => {
    settingsRef.current = { speed, pauseOnHover }
  }, [speed, pauseOnHover])

  useLayoutEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength())
  }, [])

  useLayoutEffect(() => {
    const stage = stageRef.current
    const world = worldRef.current
    if (!stage || !world) return undefined
    const fit = () => {
      const width = stage.clientWidth
      if (width > 0) world.style.transform = `scale(${width / VIEW_W})`
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const path = pathRef.current
    const stage = stageRef.current
    if (!pathLength || !slotCount || !path || !stage) return undefined

    const stride = pathLength / slotCount
    const generations = new Array(slotCount).fill(0)
    const previousDistances = new Array(slotCount).fill(null)
    let swapped = false
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceRef.current = media.matches
    const onReduce = (event) => {
      reduceRef.current = event.matches
    }
    media.addEventListener?.('change', onReduce)

    const paint = () => {
      for (let i = 0; i < slotCount; i += 1) {
        const tile = tileRefs.current[i]
        if (!tile) continue
        const distance = wrapOffset(offsetRef.current + i * stride, pathLength)
        const previous = previousDistances[i]
        if (previous !== null && slotCount < logos.length) {
          const delta = distance - previous
          if (Math.abs(delta) > pathLength / 2) {
            generations[i] += delta > 0 ? 1 : -1
            swapped = true
          }
        }
        previousDistances[i] = distance
        const point = path.getPointAtLength(distance)
        const from = path.getPointAtLength(Math.max(0, distance - 2))
        const to = path.getPointAtLength(Math.min(pathLength, distance + 2))
        const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
        tile.style.transform = `translate3d(${(point.x - TILE_W / 2).toFixed(2)}px, ${(point.y - TILE_H / 2).toFixed(2)}px, 0) rotate(${angle.toFixed(2)}deg)`
      }
      if (swapped) {
        swapped = false
        setSlotIndexes(
          Array.from({ length: slotCount }, (_, slot) =>
            wrapOffset(slot + generations[slot] * slotCount, logos.length),
          ),
        )
      }
    }

    let frame = 0
    let last = 0
    let visible = true

    const tick = (now) => {
      frame = 0
      if (!visible || document.hidden) return
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      if (!dragRef.current.active) {
        const { speed: base, pauseOnHover: pause } = settingsRef.current
        const sign = directionRef.current === 'right' ? 1 : -1
        const halted = reduceRef.current || (pause && hoverRef.current)
        const target = halted ? 0 : sign * base * 60
        velocityRef.current += (target - velocityRef.current) * (1 - Math.exp(-dt * 3))
        const step = velocityRef.current * dt
        if (Math.abs(step) > 0.0001) {
          offsetRef.current = wrapOffset(offsetRef.current + step, pathLength)
        }
      }
      paint()
      frame = requestAnimationFrame(tick)
    }

    const sync = () => {
      const shouldRun = visible && !document.hidden
      if (shouldRun && !frame) {
        last = 0
        frame = requestAnimationFrame(tick)
      } else if (!shouldRun && frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    observer.observe(stage)
    const onVisibility = () => {
      last = 0
      sync()
    }
    document.addEventListener('visibilitychange', onVisibility)
    paint()
    sync()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      media.removeEventListener?.('change', onReduce)
    }
  }, [logos, pathLength, slotCount])

  const onPointerDown = (e) => {
    if (!interactive) return
    const rect = stageRef.current?.getBoundingClientRect()
    const width = rect?.width || VIEW_W
    dragRef.current = {
      active: true,
      x: e.clientX,
      time: performance.now(),
      scale: VIEW_W / width,
      velocity: 0,
    }
    velocityRef.current = 0
    setDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    const drag = dragRef.current
    if (!drag.active) return
    const now = performance.now()
    const delta = (e.clientX - drag.x) * drag.scale
    const dt = Math.max(now - drag.time, 1) / 1000
    drag.velocity = drag.velocity * 0.5 + (delta / dt) * 0.5
    drag.x = e.clientX
    drag.time = now
    offsetRef.current = wrapOffset(offsetRef.current + delta, pathLength)
  }

  const endDrag = () => {
    const drag = dragRef.current
    if (!drag.active) return
    drag.active = false
    setDragging(false)
    const fling = performance.now() - drag.time > 100 ? 0 : Math.max(-MAX_FLING, Math.min(MAX_FLING, drag.velocity))
    velocityRef.current = fling
    if (Math.abs(fling) > 60) directionRef.current = fling > 0 ? 'right' : 'left'
  }

  const onPointerLeave = () => {
    hoverRef.current = false
    endDrag()
  }

  return (
    <div
      ref={stageRef}
      className="curved-logo-stage"
      style={{
        cursor: interactive ? (dragging ? 'grabbing' : 'grab') : 'auto',
        touchAction: interactive ? 'pan-y' : 'auto',
      }}
      role="img"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onPointerEnter={() => {
        hoverRef.current = true
      }}
      onPointerLeave={onPointerLeave}
    >
      <div ref={worldRef} className="curved-logo-world" aria-hidden="true">
        <svg className="curved-logo-path" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
          <path ref={pathRef} d={PATH_D} fill="none" stroke="none" />
        </svg>
        {pathLength > 0 &&
          Array.from({ length: slotCount }, (_, slot) => {
            const piece = logos[slotIndexes[slot] ?? slot]
            if (!piece) return null
            return (
              <div
                key={slot}
                ref={(node) => {
                  tileRefs.current[slot] = node
                }}
                className="curved-logo-tile"
                style={{ transform: 'translate3d(-9999px, -9999px, 0)' }}
              >
                <span className="curved-logo-pin" aria-hidden="true" />
                <AsciiLogo piece={piece} />
              </div>
            )
          })}
      </div>
    </div>
  )
}
