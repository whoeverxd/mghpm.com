import Image from "next/image";
import Link from "next/link";
import { landingServices, landingSteps } from "@/data/landing-page";
import { HeroParallax } from "./hero-parallax";
import styles from "./landing-page.module.css";

function Logo() {
  return (
    <Link className={styles.brand} href="/" aria-label="My Global Hub home">
      <Image src="/logo-mark.png" alt="" width={42} height={42} />
      <span>
        <strong>My Global Hub</strong>
        <small>Property Management</small>
      </span>
    </Link>
  );
}

export function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Logo />
          <nav className={styles.navigation} aria-label="Main navigation">
            <Link href="/stays">Explore stays</Link>
            <a href="#services">Services</a>
            <a href="#technology">Technology</a>
            <a href="#how">How it works</a>
          </nav>
          <div className={styles.headerActions}>
            <Link className={styles.loginLink} href="/acceder">
              Portal Login
            </Link>
            <a className={styles.primaryButton} href="#contact">
              Free Consultation
            </a>
          </div>
        </div>
      </header>

      <HeroParallax />

      <section className={styles.section} id="services">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>What we do</p>
            <h2>Everything your property needs, handled with care.</h2>
          </div>
          <span className={styles.goldRule} aria-hidden="true" />
        </div>
        <div className={styles.servicesGrid}>
          {landingServices.map((service, index) => (
            <article className={styles.serviceCard} key={service.title}>
              <span className={styles.serviceNumber}>
                0{index + 1}
              </span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <span className={styles.serviceRule} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.technologySection} id="technology">
        <div className={`${styles.technologyGrid} ${styles.technologySingle}`}>
          <div>
            <p className={styles.eyebrowLight}>Our technology</p>
            <h2>Property management, made beautifully simple.</h2>
            <p className={styles.technologyDescription}>
              Owners see leases, statements and documents in real time. Tenants
              pay rent and request maintenance in a few taps.
            </p>
            <ul className={styles.technologyList}>
              <li>Owner Portal — properties, leases, statements</li>
              <li>Tenant Portal — payments & maintenance</li>
              <li>Digital Inspections — photo evidence</li>
              <li>Document Center — role-based access</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.section} id="how">
        <p className={`${styles.eyebrow} ${styles.centered}`}>
          How it works
        </p>
        <h2 className={styles.centeredHeading}>
          From first call to full peace of mind.
        </h2>
        <div className={styles.stepsGrid}>
          {landingSteps.map((step) => (
            <article className={styles.step} key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.contactSection} id="contact">
        <div className={styles.contactCard}>
          <Image
            src="/landing/villa.jpg"
            alt=""
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div className={styles.contactOverlay} />
          <div className={styles.contactContent}>
            <h2>Let&apos;s talk about your property.</h2>
            <p>
              Book a free consultation and receive a tailored management
              proposal.
            </p>
            <a className={styles.goldButton} href="mailto:info@myglobalhubpm.com">
              Schedule a Consultation
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Logo />
          <p>
            © {new Date().getFullYear()} My Global Hub Property Management ·
            Subsidiary of MGHIR
          </p>
        </div>
      </footer>
    </main>
  );
}
