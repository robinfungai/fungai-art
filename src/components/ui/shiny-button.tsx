import type React from "react"
import "./shiny-button.css"

// Shiny CTA button (animated conic border + shimmer).
//
// Adapted for this Vite app: the original used Next.js's `<style jsx>`,
// which Vite doesn't support (React would render a stray `jsx` attribute
// and warn), so the styles live in ./shiny-button.css instead. The
// "use client" directive is dropped too — it only matters in Next.js.
//
// The static /community/academy page can't import this module, so it
// mirrors the same CSS in its <style id="fa-shiny-cta"> block. Keep the
// two in step when changing the look.
//
// Colours are CSS variables; override them per use, e.g. the Fungai
// palette the Academy uses:
//   <ShinyButton className="fa-myc">Enter the mycelium</ShinyButton>

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export function ShinyButton({ children, className = "", type = "button", ...rest }: ShinyButtonProps) {
  return (
    <button type={type} className={`shiny-cta ${className}`.trim()} {...rest}>
      <span>{children}</span>
    </button>
  )
}
