import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Mapleleaf Moving Co | Toronto Movers" },
      { name: "description", content: "Contact Mapleleaf Moving Co at 207 Weston Road in Toronto for moving questions, scheduling help, and quote support." },
      { property: "og:title", content: "Contact Mapleleaf Moving Co | Toronto Movers" },
      { property: "og:description", content: "Visit, call, email, or send Mapleleaf Moving Co a message about your GTA move." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <PageShell lightHeader>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
        <header className="max-w-3xl">
          <p className="text-sm font-bold uppercase text-maple">Contact us</p>
          <h1 className="mt-2 font-display text-4xl text-brand md:text-5xl">Let’s talk about your move.</h1>
          <p className="mt-4 text-lg text-muted-foreground">Call, email, visit, or send us your questions. Our Toronto team is ready to help.</p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="bg-brand p-7 text-cream shadow-xl md:p-9" aria-labelledby="contact-details">
            <h2 id="contact-details" className="font-display text-3xl">Mapleleaf Moving Co</h2>
            <div className="mt-8 space-y-6">
              <a href="https://www.google.com/maps/search/?api=1&query=207+Weston+Road+Toronto+ON+M6N+4Z3" target="_blank" rel="noreferrer" className="flex items-start gap-4 hover:text-amber">
                <MapPin className="mt-1 size-5 shrink-0 text-amber" />
                <span><strong className="block">Visit us</strong><span className="mt-1 block text-cream/75">207 Weston Road<br />Toronto, ON M6N 4Z3</span></span>
              </a>
              <a href="tel:+14167377674" className="flex items-start gap-4 hover:text-amber">
                <Phone className="mt-1 size-5 shrink-0 text-amber" />
                <span><strong className="block">Call us</strong><span className="mt-1 block text-cream/75">416 737 7674</span></span>
              </a>
              <a href="mailto:hi@mapleleafmovingco.com" className="flex items-start gap-4 hover:text-amber">
                <Mail className="mt-1 size-5 shrink-0 text-amber" />
                <span><strong className="block">Email us</strong><span className="mt-1 block break-all text-cream/75">hi@mapleleafmovingco.com</span></span>
              </a>
            </div>
            <div className="mt-10 border-t border-cream/15 pt-6">
              <p className="text-sm text-cream/70">Ready for an estimate?</p>
              <Button asChild className="mt-3 bg-maple hover:bg-maple-deep"><Link to="/quote">Get an instant quote</Link></Button>
            </div>
          </section>

          <section className="border border-border bg-card p-6 shadow-xl md:p-9" aria-labelledby="message-heading">
            <h2 id="message-heading" className="font-display text-3xl text-brand">Send a message</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tell us how we can help and our team will follow up.</p>
            {sent ? (
              <div role="status" className="mt-8 border-l-4 border-maple bg-maple/10 p-5">
                <CheckCircle2 className="size-7 text-maple" />
                <h3 className="mt-3 text-lg font-bold text-brand">Thanks for reaching out.</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your message is ready for our team. For immediate help, call 416 737 7674.</p>
                <Button type="button" variant="outline" className="mt-5" onClick={() => setSent(false)}>Send another message</Button>
              </div>
            ) : (
              <form onSubmit={submitMessage} className="mt-7 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Full name<input name="name" autoComplete="name" required className="mt-2 w-full border border-input bg-background p-3 font-normal outline-none focus:border-maple" /></label>
                  <label className="text-sm font-semibold">Phone number<input name="phone" type="tel" autoComplete="tel" required className="mt-2 w-full border border-input bg-background p-3 font-normal outline-none focus:border-maple" /></label>
                </div>
                <label className="block text-sm font-semibold">Email address<input name="email" type="email" autoComplete="email" required className="mt-2 w-full border border-input bg-background p-3 font-normal outline-none focus:border-maple" /></label>
                <label className="block text-sm font-semibold">What can we help with?<select name="topic" className="mt-2 w-full border border-input bg-background p-3 font-normal outline-none focus:border-maple"><option>Moving quote</option><option>Existing booking</option><option>Packing or storage</option><option>General question</option></select></label>
                <label className="block text-sm font-semibold">Message<textarea name="message" required rows={6} className="mt-2 w-full resize-y border border-input bg-background p-3 font-normal outline-none focus:border-maple" /></label>
                <Button type="submit" className="bg-maple px-6 hover:bg-maple-deep">Send message</Button>
              </form>
            )}
          </section>
        </div>
      </main>
    </PageShell>
  );
}