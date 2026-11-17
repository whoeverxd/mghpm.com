import { createFileRoute } from "@tanstack/react-router";
import { HeroParallax } from "@/components/HeroParallax";
import logo from "@/assets/mghpm-logo.png.asset.json";
import villa from "@/assets/villa.jpg";
import penthouse from "@/assets/penthouse.jpg";
import residence from "@/assets/residence.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Global Hub Property Management | Caribbean Property Experts" },
      { name: "description", content: "Professional property management in the Dominican Republic and the Caribbean. Leasing, rent collection, maintenance and transparent owner reporting on one platform." },
      { property: "og:title", content: "My Global Hub Property Management" },
      { property: "og:description", content: "Your Property. Our Expertise. Your Peace of Mind." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Logo() {
  return (
    <a href="#" className="flex items-center">
      <img src={logo.url} alt="My Global Hub Property Management" width={1898} height={595} className="h-11 w-auto" />
    </a>
  );
}

const services = [
  ["Marketing & Leasing", "Professional photography, premium listings and qualified tenant placement."],
  ["Tenant Screening", "Identity, income and reference checks before every signature."],
  ["Rent Collection", "Online payments, automatic reminders and on-time deposits."],
  ["Maintenance", "Vetted local vendors, tracked from request to completion."],
  ["Digital Inspections", "Room-by-room checklists with photographic evidence."],
  ["Financial Reporting", "Monthly statements and real-time visibility from anywhere."],
];

const properties = [
  { img: villa, name: "Villa Arrecife", place: "Punta Cana", price: "$6,800", meta: "5 bd · 5 ba · Pool", status: "Available" },
  { img: penthouse, name: "Kite Beach Penthouse", place: "Cabarete", price: "$3,200", meta: "3 bd · 2 ba · Ocean view", status: "Application Pending" },
  { img: residence, name: "Residencial Romana", place: "La Romana", price: "$1,850", meta: "2 bd · 2 ba · Garden", status: "Available" },
];

const steps = [
  ["01", "Consultation", "We review your property, goals and local market."],
  ["02", "Onboarding", "Inspection, pricing strategy and portal access in days."],
  ["03", "Management", "We lease, collect and maintain — you stay informed."],
  ["04", "Reporting", "Clear statements and documents, always at hand."],
];

function Index() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-9 text-sm font-medium text-muted-foreground md:flex">
            <a href="#services" className="transition-colors hover:text-primary">Services</a>
            <a href="#properties" className="transition-colors hover:text-primary">Properties</a>
            <a href="#technology" className="transition-colors hover:text-primary">Technology</a>
            <a href="#how" className="transition-colors hover:text-primary">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="hidden text-sm font-semibold text-primary sm:block">Portal Login</button>
            <a href="#contact" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-deep">
              Free Consultation
            </a>
          </div>
        </div>
      </header>

      <HeroParallax />

      <section className="relative z-10 -mt-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-soft md:grid-cols-4">
            {[["100%", "Transparent reporting"], ["24/7", "Owner & tenant portals"], ["48h", "Maintenance response"], ["1", "Platform for everything"]].map(([n, l]) => (
              <div key={l} className="bg-card px-6 py-7 text-center">
                <div className="font-display text-4xl font-semibold text-primary">{n}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-7xl px-6 py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">What we do</p>
            <h2 className="mt-4 max-w-xl text-4xl font-medium md:text-5xl">Everything your property needs, handled with care.</h2>
          </div>
          <div className="gold-rule w-40" />
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map(([t, d], i) => (
            <div key={t} className="group rounded-2xl border bg-card p-8 transition duration-500 hover:-translate-y-1 hover:border-gold hover:shadow-soft">
              <div className="font-display text-sm text-gold">0{i + 1}</div>
              <h3 className="mt-4 text-2xl font-semibold">{t}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{d}</p>
              <div className="mt-6 h-px w-10 bg-primary transition-all duration-500 group-hover:w-24" />
            </div>
          ))}
        </div>
      </section>

      {/* Properties */}
      <section id="properties" className="bg-card py-28">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow">Featured properties</p>
          <h2 className="mt-4 text-4xl font-medium md:text-5xl">Homes worth coming home to.</h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {properties.map((p) => (
              <article key={p.name} className="group overflow-hidden rounded-2xl border bg-background">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={p.img} alt={`${p.name}, ${p.place}`} loading="lazy" width={1024} height={1024} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${p.status === "Available" ? "bg-primary-soft text-primary-deep" : "bg-gold-soft text-navy"}`}>
                    {p.status}
                  </span>
                </div>
                <div className="p-6">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{p.place}</div>
                  <h3 className="mt-2 text-2xl font-semibold">{p.name}</h3>
                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-sm text-muted-foreground">{p.meta}</span>
                    <span className="font-display text-2xl font-semibold text-primary">{p.price}<span className="text-sm text-muted-foreground">/mo</span></span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="bg-teal-gradient py-28 text-primary-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <p className="eyebrow !text-gold">Our technology</p>
            <h2 className="mt-4 text-4xl font-medium !text-primary-foreground md:text-5xl">Property management, made beautifully simple.</h2>
            <p className="mt-6 max-w-md text-lg text-primary-foreground/75">
              Owners see leases, statements and documents in real time. Tenants pay rent and request maintenance in a few taps.
            </p>
            <ul className="mt-10 space-y-4">
              {["Owner Portal — properties, leases, statements", "Tenant Portal — payments & maintenance", "Digital Inspections — photo evidence", "Document Center — role-based access"].map((x) => (
                <li key={x} className="flex items-center gap-4 text-primary-foreground/90">
                  <span className="h-2 w-2 rounded-full bg-gold" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/10 p-3 shadow-soft backdrop-blur">
            <div className="rounded-2xl bg-card p-6 text-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Owner overview</div>
                  <div className="font-display text-3xl font-semibold text-navy">$24,580</div>
                  <div className="text-xs text-primary">Net income · this quarter</div>
                </div>
                <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-navy">3 properties</span>
              </div>
              <div className="mt-6 flex h-32 items-end gap-2">
                {[40, 55, 48, 70, 62, 84, 78, 92].map((h, i) => (
                  <div key={i} className={`flex-1 rounded-t ${i === 7 ? "bg-gold" : "bg-primary/80"}`} style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-6 space-y-3 text-sm">
                {[["Rent received · Villa Arrecife", "+$6,800"], ["Pool maintenance", "−$240"], ["Rent received · Kite Beach", "+$3,200"]].map(([a, b]) => (
                  <div key={a} className="flex justify-between border-t pt-3">
                    <span className="text-muted-foreground">{a}</span>
                    <span className="font-semibold">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-28">
        <p className="eyebrow text-center">How it works</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-center text-4xl font-medium md:text-5xl">From first call to full peace of mind.</h2>
        <div className="mt-16 grid gap-10 md:grid-cols-4">
          {steps.map(([n, t, d]) => (
            <div key={n} className="border-t-2 border-gold pt-6">
              <div className="font-display text-5xl font-light text-primary/40">{n}</div>
              <h3 className="mt-3 text-2xl font-semibold">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="px-6 pb-28">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl shadow-soft">
          <img src={villa} alt="Caribbean villa at sunset" loading="lazy" width={1280} height={896} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-navy/70" />
          <div className="relative px-8 py-20 text-center md:py-28">
            <h2 className="mx-auto max-w-2xl text-4xl font-medium !text-primary-foreground md:text-6xl">Let's talk about your property.</h2>
            <p className="mx-auto mt-5 max-w-lg text-primary-foreground/80">Book a free consultation and receive a tailored management proposal.</p>
            <a href="mailto:info@myglobalhubpm.com" className="mt-10 inline-block rounded-full bg-gold px-8 py-4 text-sm font-semibold text-navy shadow-gold transition hover:-translate-y-0.5">
              Schedule a Consultation
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">© 2026 My Global Hub Property Management · Subsidiary of MGHIR</p>
        </div>
      </footer>
    </div>
  );
}
