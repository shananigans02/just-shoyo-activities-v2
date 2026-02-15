import { Helmet } from "react-helmet-async";

/**
 * SEO configuration for the site.
 * Manages all meta tags, Open Graph, Twitter Cards, and JSON-LD.
 */

interface SEOProps {
  /** Page title */
  title?: string;
  /** Meta description */
  description?: string;
  /** Canonical URL */
  canonicalUrl?: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** Twitter handle (without @) */
  twitterHandle?: string;
  /** Site name for OG */
  siteName?: string;
  /** Person schema data */
  person?: {
    name: string;
    jobTitle: string;
    email?: string;
    url?: string;
    sameAs?: string[];
  };
}

// Default configuration
const DEFAULTS = {
  title: "yyyyaaa — Product Engineer",
  description:
    "An infinite workspace of procedural tasks. Product Engineer building digital experiences at the intersection of design and engineering.",
  siteName: "yyyyaaa",
  canonicalUrl: "https://yyyyaaa.com", // Update with actual domain
  ogImage: "/og-image.png", // You'll need to create this
  twitterHandle: "yyyyaaa",
};

/**
 * SEO Component - Manages document head for search engines and social sharing.
 *
 * Usage:
 * ```tsx
 * <SEO
 *   title="Custom Title"
 *   description="Custom description"
 * />
 * ```
 */
export function SEO({
  title = DEFAULTS.title,
  description = DEFAULTS.description,
  canonicalUrl = DEFAULTS.canonicalUrl,
  ogImage = DEFAULTS.ogImage,
  twitterHandle = DEFAULTS.twitterHandle,
  siteName = DEFAULTS.siteName,
  person,
}: SEOProps) {
  // Default person schema
  const personData = person ?? {
    name: "yyyyaaa",
    jobTitle: "Product Engineer",
    email: "phatghaa@gmail.com",
    url: canonicalUrl,
    sameAs: [
      "https://github.com/yyyyaaa",
      "https://twitter.com/yyyyaaa",
      "https://linkedin.com/in/yyyyaaa",
    ],
  };

  // JSON-LD structured data for Person
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: personData.name,
    jobTitle: personData.jobTitle,
    email: personData.email ? `mailto:${personData.email}` : undefined,
    url: personData.url,
    sameAs: personData.sameAs,
    knowsAbout: [
      "Product Engineering",
      "Web Development",
      "User Experience",
      "TypeScript",
      "React",
    ],
  };

  // Clean undefined values from JSON-LD
  const cleanJsonLd = JSON.stringify(
    Object.fromEntries(
      Object.entries(jsonLd).filter(([, v]) => v !== undefined)
    )
  );

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta content={description} name="description" />
      <link href={canonicalUrl} rel="canonical" />

      {/* Open Graph / Facebook */}
      <meta content="website" property="og:type" />
      <meta content={canonicalUrl} property="og:url" />
      <meta content={title} property="og:title" />
      <meta content={description} property="og:description" />
      <meta content={`${canonicalUrl}${ogImage}`} property="og:image" />
      <meta content={siteName} property="og:site_name" />
      <meta content="en_US" property="og:locale" />

      {/* Twitter */}
      <meta content="summary_large_image" name="twitter:card" />
      <meta content={`@${twitterHandle}`} name="twitter:site" />
      <meta content={`@${twitterHandle}`} name="twitter:creator" />
      <meta content={title} name="twitter:title" />
      <meta content={description} name="twitter:description" />
      <meta content={`${canonicalUrl}${ogImage}`} name="twitter:image" />

      {/* Additional SEO */}
      <meta content="index, follow" name="robots" />
      <meta content={personData.name} name="author" />
      <meta
        content="Product Engineer, Web Developer, Creative Developer, TypeScript, React"
        name="keywords"
      />

      {/* Theme */}
      <meta content="#ffffff" name="theme-color" />
      <meta content="#ffffff" name="msapplication-TileColor" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">{cleanJsonLd}</script>
    </Helmet>
  );
}

/**
 * Export default SEO values for reuse
 */
export const SEO_DEFAULTS = DEFAULTS;
