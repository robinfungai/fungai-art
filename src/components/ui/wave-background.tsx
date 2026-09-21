import * as React from 'react'
import { useEffect, useRef } from 'react'
import { createNoise2D } from 'simplex-noise'

// Animated wave-line background (SVG + simplex noise).
//
// Adapted for this repo:
//  · "use client" dropped (Next.js-only)
//  · `xGap` / `yGap` props (default 8, as the original). Points per frame =
//    (width / xGap) × (height / yGap): at 8 px on a 1440×900 screen that's
//    ~24,000 noise samples a frame, too much for a background under a busy
//    tool page, so /mixology and /extraction pass larger gaps
//  · pointer maths uses the live on-screen rect. The original added
//    window.scrollY to pageY, which double-counts scroll, and was wrong
//    for a fixed background
//  · pauses while the tab is hidden; draws one still frame when the visitor
//    prefers reduced motion
//
// Used on /mixology and /extraction through src/islands/waves.tsx.

interface Point {
    x: number
    y: number
    wave: { x: number; y: number }
    cursor: {
        x: number
        y: number
        vx: number
        vy: number
    }
}

interface WavesProps {
    className?: string
    strokeColor?: string
    backgroundColor?: string
    pointerSize?: number
    xGap?: number
    yGap?: number
    style?: React.CSSProperties
}

export function Waves({
    className = "",
    strokeColor = "#ffffff",  // White lines
    backgroundColor = "#000000",  // Black background
    pointerSize = 0.5,
    xGap = 8,
    yGap = 8,
    style,
}: WavesProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const mouseRef = useRef({
        x: -10,
        y: 0,
        lx: 0,
        ly: 0,
        sx: 0,
        sy: 0,
        v: 0,
        vs: 0,
        a: 0,
        set: false,
    })
    const pathsRef = useRef<SVGPathElement[]>([])
    const linesRef = useRef<Point[][]>([])
    const noiseRef = useRef<((x: number, y: number) => number) | null>(null)
    const rafRef = useRef<number | null>(null)
    const boundingRef = useRef<DOMRect | null>(null)

    // Initialization
    useEffect(() => {
        const container = containerRef.current
        if (!container || !svgRef.current) return

        const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

        // Initialize noise generator
        noiseRef.current = createNoise2D()

        // Initialize size and lines
        setSize()
        setLines()

        const start = () => { if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick) }
        const stop = () => { if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null } }
        const onVisibility = () => { if (document.hidden) stop(); else if (!reduceMotion) start() }

        // Bind events
        window.addEventListener('resize', onResize)
        window.addEventListener('mousemove', onMouseMove)
        container.addEventListener('touchmove', onTouchMove, { passive: false })
        document.addEventListener('visibilitychange', onVisibility)

        if (reduceMotion) {
            movePoints(0)
            drawLines()
        } else {
            start()
        }

        return () => {
            stop()
            window.removeEventListener('resize', onResize)
            window.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('touchmove', onTouchMove)
            document.removeEventListener('visibilitychange', onVisibility)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Set SVG size
    const setSize = () => {
        if (!containerRef.current || !svgRef.current) return

        boundingRef.current = containerRef.current.getBoundingClientRect()
        const { width, height } = boundingRef.current

        svgRef.current.style.width = `${width}px`
        svgRef.current.style.height = `${height}px`
    }

    // Setup lines
    const setLines = () => {
        if (!svgRef.current || !boundingRef.current) return

        const { width, height } = boundingRef.current
        linesRef.current = []

        // Clear existing paths
        pathsRef.current.forEach(path => {
            path.remove()
        })
        pathsRef.current = []

        const oWidth = width + 200
        const oHeight = height + 30

        const totalLines = Math.ceil(oWidth / xGap)
        const totalPoints = Math.ceil(oHeight / yGap)

        const xStart = (width - xGap * totalLines) / 2
        const yStart = (height - yGap * totalPoints) / 2

        // Create vertical lines
        for (let i = 0; i < totalLines; i++) {
            const points: Point[] = []

            for (let j = 0; j < totalPoints; j++) {
                points.push({
                    x: xStart + xGap * i,
                    y: yStart + yGap * j,
                    wave: { x: 0, y: 0 },
                    cursor: { x: 0, y: 0, vx: 0, vy: 0 },
                })
            }

            // Create SVG path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            path.classList.add('a__line')
            path.classList.add('js-line')
            path.setAttribute('fill', 'none')
            path.setAttribute('stroke', strokeColor)
            path.setAttribute('stroke-width', '1')

            svgRef.current.appendChild(path)
            pathsRef.current.push(path)

            // Add points
            linesRef.current.push(points)
        }
    }

    // Resize handler
    const onResize = () => {
        setSize()
        setLines()
    }

    // Mouse handler
    const onMouseMove = (e: MouseEvent) => {
        updateMousePosition(e.clientX, e.clientY)
    }

    // Touch handler
    const onTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        const touch = e.touches[0]
        updateMousePosition(touch.clientX, touch.clientY)
    }

    // Update mouse position (viewport coordinates → container coordinates)
    const updateMousePosition = (x: number, y: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()

        const mouse = mouseRef.current
        mouse.x = x - rect.left
        mouse.y = y - rect.top

        if (!mouse.set) {
            mouse.sx = mouse.x
            mouse.sy = mouse.y
            mouse.lx = mouse.x
            mouse.ly = mouse.y

            mouse.set = true
        }

        // Update CSS variables
        containerRef.current.style.setProperty('--x', `${mouse.sx}px`)
        containerRef.current.style.setProperty('--y', `${mouse.sy}px`)
    }

    // Move points - smoother wave motion
    const movePoints = (time: number) => {
        const { current: lines } = linesRef
        const { current: mouse } = mouseRef
        const { current: noise } = noiseRef

        if (!noise) return

        lines.forEach((points) => {
            points.forEach((p: Point) => {
                // Wave movement
                const move = noise(
                    (p.x + time * 0.008) * 0.003,
                    (p.y + time * 0.003) * 0.002
                ) * 8

                p.wave.x = Math.cos(move) * 12
                p.wave.y = Math.sin(move) * 6

                // Mouse effect
                const dx = p.x - mouse.sx
                const dy = p.y - mouse.sy
                const d = Math.hypot(dx, dy)
                const l = Math.max(175, mouse.vs)

                if (d < l) {
                    const s = 1 - d / l
                    const f = Math.cos(d * 0.001) * s

                    p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035
                    p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035
                }

                p.cursor.vx += (0 - p.cursor.x) * 0.01
                p.cursor.vy += (0 - p.cursor.y) * 0.01

                p.cursor.vx *= 0.95
                p.cursor.vy *= 0.95

                p.cursor.x += p.cursor.vx
                p.cursor.y += p.cursor.vy

                p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x))
                p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y))
            })
        })
    }

    // Get moved point coordinates
    const moved = (point: Point, withCursorForce = true) => ({
        x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
        y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
    })

    // Draw lines - using line segments
    const drawLines = () => {
        const { current: lines } = linesRef
        const { current: paths } = pathsRef

        lines.forEach((points, lIndex) => {
            if (points.length < 2 || !paths[lIndex]) return

            const firstPoint = moved(points[0], false)
            let d = `M ${firstPoint.x} ${firstPoint.y}`

            for (let i = 1; i < points.length; i++) {
                const current = moved(points[i])
                d += `L ${current.x} ${current.y}`
            }

            paths[lIndex].setAttribute('d', d)
        })
    }

    // Animation logic
    const tick = (time: number) => {
        const { current: mouse } = mouseRef

        // Smooth mouse movement
        mouse.sx += (mouse.x - mouse.sx) * 0.1
        mouse.sy += (mouse.y - mouse.sy) * 0.1

        // Mouse velocity
        const dx = mouse.x - mouse.lx
        const dy = mouse.y - mouse.ly
        const d = Math.hypot(dx, dy)

        mouse.v = d
        mouse.vs += (d - mouse.vs) * 0.1
        mouse.vs = Math.min(100, mouse.vs)

        // Previous mouse position
        mouse.lx = mouse.x
        mouse.ly = mouse.y

        // Mouse angle
        mouse.a = Math.atan2(dy, dx)

        if (containerRef.current) {
            containerRef.current.style.setProperty('--x', `${mouse.sx}px`)
            containerRef.current.style.setProperty('--y', `${mouse.sy}px`)
        }

        movePoints(time)
        drawLines()

        rafRef.current = requestAnimationFrame(tick)
    }

    return (
        <div
            ref={containerRef}
            className={`waves-component relative overflow-hidden ${className}`}
            style={{
                backgroundColor,
                position: 'absolute',
                top: 0,
                left: 0,
                margin: 0,
                padding: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                '--x': '-0.5rem',
                '--y': '50%',
                ...style,
            } as React.CSSProperties}
        >
            <svg
                ref={svgRef}
                className="block w-full h-full js-svg"
                xmlns="http://www.w3.org/2000/svg"
            />
            <div
                className="pointer-dot"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${pointerSize}rem`,
                    height: `${pointerSize}rem`,
                    background: strokeColor,
                    borderRadius: '50%',
                    transform: 'translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)',
                    willChange: 'transform',
                }}
            />
        </div>
    )
}
