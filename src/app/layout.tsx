import type { Metadata, Viewport } from "next";
import { Courier_Prime } from "next/font/google";
import Providers from "@/components/Providers";
import SketchFilters from "@/components/sketch/SketchFilters";
import ScrollReveal from "@/components/sketch/ScrollReveal";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { EDUCATION, PERSON } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Courier New is the face; Courier Prime only fills in where it is missing,
// so it is not preloaded and most visitors never download it
const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier-prime",
  display: "swap",
  preload: false,
});

const description = `${PERSON.name}, ${PERSON.role} in ${PERSON.location}. ${PERSON.line}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${PERSON.name} — ${PERSON.role}`,
    template: `%s — ${PERSON.short}`,
  },
  description,
  authors: [{ name: PERSON.name, url: PERSON.github }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: PERSON.name,
    title: `${PERSON.name} — ${PERSON.role}`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${PERSON.name} — ${PERSON.role}`,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#eaebe6",
};

/** Who the site is about, said plainly for search engines. */
const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PERSON.name,
  alternateName: PERSON.short,
  jobTitle: PERSON.role,
  description,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  email: `mailto:${PERSON.email}`,
  sameAs: [PERSON.github, PERSON.linkedin],
  address: { "@type": "PostalAddress", addressLocality: "Rawalpindi", addressCountry: "PK" },
  alumniOf: { "@type": "CollegeOrUniversity", name: EDUCATION.school },
  knowsAbout: ["React", "Next.js", "TypeScript", "Node.js", "FastAPI", "Python", "Large Language Models", "Retrieval-Augmented Generation", "PostgreSQL", "MongoDB"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={courierPrime.variable}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }} />
        <SketchFilters />
        <ScrollReveal />
        <a href="#main" className="sketch-btn sketch-btn--sm sketch-btn--calm sr-only bg-paper-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]">
          Skip to content
        </a>
        <Providers>
          <Nav />
          <main id="main" className="overflow-x-clip">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
