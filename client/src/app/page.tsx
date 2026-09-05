import type { Metadata } from 'next';

import { Photo } from '@/components/site/photo';
import { SiteNav } from '@/components/site/site-nav';
import { Monogram } from '@/components/wordmark';
import { business, whatsappUrl } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Teegold Interiors — Blinds, curtains and window treatments in Ado-Ekiti',
  description:
    'Bespoke blinds, curtains and window treatments, measured and installed in Ado-Ekiti by Teegold Interiors.',
};

const promises = [
  { title: 'Made to measure', body: 'Every panel cut to your window, not to a standard size.' },
  { title: 'Expert installation', body: 'Fitted by our own team, tidied up before we leave.' },
  { title: `Trusted in ${business.area}`, body: 'Homes, offices and shops across Ekiti State.' },
];

const services = [
  {
    title: 'Blinds',
    body: 'Zebra, roller, venetian, vertical and roman blinds for light you can control.',
    src: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=80',
    alt: 'Wooden window blinds in a bright living room',
  },
  {
    title: 'Curtains',
    body: 'Fabrics, linings, rods and tracks, sewn and hung to suit the room.',
    src: 'https://images.unsplash.com/photo-1615529186704-7d115b368272?auto=format&fit=crop&w=1200&q=80',
    alt: 'Floor-length curtains in a dressed bedroom',
  },
  {
    title: 'Measure and install',
    body: 'We measure on site, quote in writing, then fit it properly.',
    src: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Installer measuring a window frame',
  },
];

const projects = [
  {
    src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80',
    alt: 'Living room with layered curtains',
  },
  {
    src: 'https://images.unsplash.com/photo-1616594039964-0e172c361785?auto=format&fit=crop&w=1000&q=80',
    alt: 'Bedroom with blackout drapes',
  },
  {
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80',
    alt: 'Office with roller blinds',
  },
  {
    src: 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1000&q=80',
    alt: 'Dining room with sheer panels',
  },
];

const LandingPage = () => (
  <div className="min-h-screen bg-page text-page-ink">
    <SiteNav />

    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="font-serif text-5xl leading-[1.1] lg:text-6xl">
            Windows dressed with intention
          </h1>
          <p className="mt-5 max-w-md text-page-ink/70">
            Bespoke blinds, curtains and window treatments, measured and installed in{' '}
            {business.area}.
          </p>

          <div className="mt-8 flex items-center gap-6">
            <a
              href="#contact"
              className="rounded-card bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Request a quote
            </a>
            <a href="#work" className="text-sm text-page-ink/70 hover:text-page-ink">
              View our work →
            </a>
          </div>
        </div>

        <Photo
          src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1600&q=80"
          alt="Sunlit living room with sheer curtains and wooden blinds"
          className="h-80 lg:h-104"
        />
      </section>

      <section className="border-y border-page-hairline bg-stone">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3">
          {promises.map((promise) => (
            <div key={promise.title}>
              <p className="font-serif text-lg">{promise.title}</p>
              <p className="mt-1 text-sm text-page-ink/60">{promise.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <h2 className="font-serif text-3xl">What we do</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="rounded-card overflow-hidden border border-page-hairline bg-white"
            >
              <Photo src={service.src} alt={service.alt} className="h-48" />
              <div className="p-5">
                <h3 className="font-serif text-xl">{service.title}</h3>
                <p className="mt-2 text-sm text-page-ink/65">{service.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="work" className="mx-auto max-w-6xl px-6 pb-16 lg:pb-20">
        <h2 className="font-serif text-3xl">Our recent work</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {projects.map((project) => (
            <Photo key={project.src} src={project.src} alt={project.alt} className="aspect-square" />
          ))}
        </div>
      </section>

      <section className="border-y border-page-hairline bg-stone">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="font-serif text-2xl leading-relaxed italic">
            “Teegold Interiors transformed our home. The fit was perfect and the finishing is
            beautiful.”
          </p>
          <p className="mt-5 text-xs tracking-[0.18em] text-page-ink/50 uppercase">
            Mrs. O. Adeyemi · {business.area}
          </p>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl">Ready to dress your windows?</h2>
            <p className="mt-3 max-w-md text-page-ink/70">
              Tell us about your windows and we will measure, advise and quote. Message us on
              WhatsApp for the quickest reply.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={whatsappUrl(
                  `Hello ${business.name}, I would like a quote for window treatments.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="rounded-card bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Message us on WhatsApp
              </a>
              <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="text-sm underline underline-offset-4">
                Call {business.phone}
              </a>
            </div>
          </div>

          <dl className="rounded-card grid gap-5 border border-page-hairline bg-white p-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs tracking-[0.14em] text-page-ink/45 uppercase">Phone</dt>
              <dd className="mt-1 text-sm">{business.phone}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.14em] text-page-ink/45 uppercase">Email</dt>
              <dd className="mt-1 text-sm">{business.email}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs tracking-[0.14em] text-page-ink/45 uppercase">Showroom</dt>
              <dd className="mt-1 text-sm">{business.address}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs tracking-[0.14em] text-page-ink/45 uppercase">Hours</dt>
              <dd className="mt-1 text-sm">Monday to Saturday, 9am – 6pm</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>

    <footer className="bg-charcoal text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-8 px-6 py-12">
        <div>
          <span className="flex items-center gap-3">
            <Monogram className="size-9 text-white" />
            <span className="font-serif text-base tracking-[0.2em] uppercase">
              Teegold Interiors
            </span>
          </span>
          <p className="mt-4 text-sm text-white/55">{business.tagline}</p>
        </div>

        <div className="text-sm text-white/70">
          <p>{business.phone}</p>
          <p className="mt-1">{business.email}</p>
          <p className="mt-1">{business.address}</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-6 py-5 text-xs text-white/40">
          © {new Date().getFullYear()} {business.name}. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
);

export default LandingPage;
