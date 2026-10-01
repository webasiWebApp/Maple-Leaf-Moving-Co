import { Link } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/mapleleaf-moving-wordmark-transparent.png";

export function SiteHeader({ light = false }: { light?: boolean }) {
  return <header className={`border-b px-4 py-3 backdrop-blur md:px-10 ${light ? "border-ink/10 bg-background/80 text-ink" : "border-cream/15 bg-brand/95 text-cream"}`}>
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
      <Link to="/" className="min-w-0"><img src={logo} alt="Maple Leaf Moving Co" className="h-auto w-64 object-contain sm:w-72"/></Link>
      <nav className="flex w-full items-center justify-center gap-3 text-sm font-semibold sm:w-auto sm:justify-end sm:gap-5">
        <Link to="/quote" className="rounded-md bg-maple px-3 py-2 text-primary-foreground hover:bg-maple-deep">Get a quote</Link>
        <Link to="/contact" className={light ? "hover:text-maple" : "hover:text-amber"}>Contact us</Link>
        <Link to="/portal" className={light ? "hover:text-maple" : "hover:text-amber"}>My move</Link>
      </nav>
    </div>
    <div className={`mx-auto mt-2 flex max-w-7xl flex-wrap justify-end gap-4 text-xs ${light ? "text-ink/70" : "text-cream/80"}`}>
      <a href="tel:+14167377674" className="flex items-center gap-1"><Phone className="size-3"/>416 737 7674</a>
      <a href="mailto:hi@mapleleafmovingco.com" className="flex items-center gap-1"><Mail className="size-3"/>hi@mapleleafmovingco.com</a>
    </div>
  </header>;
}

export function SiteFooter() {
  return <footer className="bg-brand px-6 py-8 text-cream">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
      <div><img src={logo} alt="Maple Leaf Moving Co" className="h-auto w-64 object-contain"/><p className="mt-2 text-xs text-cream/65">Serving the GTA since 2009 · Licensed &amp; insured</p></div>
      <div className="text-sm text-cream/75"><p>416 737 7674</p><p>hi@mapleleafmovingco.com</p></div>
    </div>
  </footer>;
}

export function PageShell({ children, lightHeader = false }: { children: ReactNode; lightHeader?: boolean }) {
  return <div className="site-wallpaper min-h-screen text-foreground" style={{ backgroundImage: `linear-gradient(oklch(0.96 0.015 85 / 88%), oklch(0.96 0.015 85 / 88%))` }}><div className="min-h-screen"><SiteHeader light={lightHeader}/>{children}<SiteFooter/></div></div>;
}
