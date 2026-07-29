# Next.js SEO Optimization Guide for Real Estate Websites

## Overview

This guide provides comprehensive SEO optimization strategies for Next.js real estate websites, with a focus on achieving top search rankings, implementing semantic URL structures, and leveraging Next.js's powerful SEO capabilities.

## Table of Contents

1. [Why Next.js is Perfect for Real Estate SEO](#why-nextjs-is-perfect-for-real-estate-seo)
2. [Property URL Structure Strategy](#property-url-structure-strategy)
3. [Next.js App Router SEO Implementation](#nextjs-app-router-seo-implementation)
4. [Real Estate-Specific SEO Tactics](#real-estate-specific-seo-tactics)
5. [Technical SEO Optimization](#technical-seo-optimization)
6. [Content Strategy for Real Estate](#content-strategy-for-real-estate)
7. [Local SEO Optimization](#local-seo-optimization)
8. [Performance & Core Web Vitals](#performance--core-web-vitals)
9. [Implementation Checklist](#implementation-checklist)

## Why Next.js is Perfect for Real Estate SEO

### Server-Side Rendering Benefits
- **Instant Indexability**: Property pages are fully rendered server-side, allowing search engines to immediately crawl and index content
- **Fast Loading**: Critical for user experience and Core Web Vitals
- **Dynamic Content**: Perfect for real-time property listings and market data

### SEO Advantages Over SPAs
- **No JavaScript Dependency**: Search engines can read content without executing JavaScript
- **Meta Tag Control**: Dynamic meta tags for each property listing
- **Structured Data**: Easy implementation of real estate schema markup

## Property URL Structure Strategy

### The Power of Address-Based URLs

Your idea of using property addresses as URLs (`frontstead.com/123-main-st-new-york`) is **excellent** for several reasons:

#### SEO Benefits
```
✅ GOOD: frontstead.com/123-main-st-new-york-ny
✅ GOOD: frontstead.com/properties/luxury-condo-downtown-seattle
✅ GOOD: frontstead.com/homes-for-sale/456-oak-avenue-miami-fl

❌ BAD: frontstead.com/property?id=12345
❌ BAD: frontstead.com/listings/prop_abc123
❌ BAD: frontstead.com/p/987654321
```

#### Why Address URLs Work
1. **Keyword Rich**: Contains natural search terms people use
2. **Memorable**: Easy for users to remember and share
3. **Semantic**: Clearly describes the content
4. **Local SEO**: Includes location-specific keywords
5. **Social Sharing**: Looks professional when shared on social media

### URL Structure Implementation

#### Dynamic Route Structure
```
app/
├── [address]/
│   └── page.tsx                    // Individual property pages
├── [city]/
│   ├── page.tsx                    // City landing pages
│   └── [neighborhood]/
│       └── page.tsx                // Neighborhood pages
├── properties/
│   ├── page.tsx                    // All properties listing
│   ├── for-sale/
│   │   └── page.tsx                // For sale properties
│   └── for-rent/
│       └── page.tsx                // For rent properties
```

#### URL Slug Generation Function
```typescript
// utils/urlHelpers.ts
export function generatePropertySlug(property: Property): string {
  const { address, city, state, zipCode } = property;

  // Clean and format the address
  const cleanAddress = address
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens

  const cleanCity = city
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

  const stateCode = state.toLowerCase().replace(/[^a-z]/g, '');

  return `${cleanAddress}-${cleanCity}-${stateCode}`;
}

// Example outputs:
// "123 Main St, New York, NY" → "123-main-st-new-york-ny"
// "456 Oak Avenue, Miami Beach, FL" → "456-oak-avenue-miami-beach-fl"
```

#### Property Page Implementation
```typescript
// app/[address]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropertyBySlug } from '@/lib/properties';
import PropertyDetail from '@/components/PropertyDetail';

interface PropertyPageProps {
  params: {
    address: string;
  };
}

// Generate metadata for each property
export async function generateMetadata(
  { params }: PropertyPageProps
): Promise<Metadata> {
  const property = await getPropertyBySlug(params.address);

  if (!property) {
    return {
      title: 'Property Not Found',
    };
  }

  const { address, city, state, price, bedrooms, bathrooms, squareFeet } = property;

  return {
    title: `${address} | ${bedrooms}BR/${bathrooms}BA Home for Sale in ${city}, ${state} | $${price.toLocaleString()}`,
    description: `Beautiful ${bedrooms} bedroom, ${bathrooms} bathroom home for sale at ${address} in ${city}, ${state}. ${squareFeet} sq ft. Contact us to schedule a viewing today!`,
    keywords: [
      `${address} for sale`,
      `${city} real estate`,
      `homes for sale ${city}`,
      `${bedrooms} bedroom house ${city}`,
      `${state} real estate`,
      `properties ${city}`,
    ],
    openGraph: {
      title: `${address} - Home for Sale in ${city}, ${state}`,
      description: `${bedrooms}BR/${bathrooms}BA • ${squareFeet} sq ft • $${price.toLocaleString()}`,
      images: [
        {
          url: property.imageUrl || '/default-property-image.jpg',
          width: 1200,
          height: 630,
          alt: `${address} - Property for Sale`,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${address} | Home for Sale in ${city}, ${state}`,
      description: `${bedrooms}BR/${bathrooms}BA • ${squareFeet} sq ft • $${price.toLocaleString()}`,
      images: [property.imageUrl || '/default-property-image.jpg'],
    },
    alternates: {
      canonical: `https://frontstead.com/${params.address}`,
    },
  };
}

// Generate static params for known properties
export async function generateStaticParams() {
  const properties = await getAllProperties();

  return properties.map((property) => ({
    address: generatePropertySlug(property),
  }));
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const property = await getPropertyBySlug(params.address);

  if (!property) {
    notFound();
  }

  return (
    <>
      <PropertyDetail property={property} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generatePropertySchema(property)),
        }}
      />
    </>
  );
}
```

## Next.js App Router SEO Implementation

### 1. Metadata API Usage

#### Root Layout Metadata
```typescript
// app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://frontstead.com'),
  title: {
    template: '%s | Frontstead Real Estate',
    default: 'Frontstead Real Estate - Find Your Dream Home',
  },
  description: 'Discover your perfect home with Frontstead Real Estate. Browse thousands of properties, get expert guidance, and find your dream home today.',
  keywords: [
    'real estate',
    'homes for sale',
    'property search',
    'real estate agent',
    'buy home',
    'sell home',
  ],
  authors: [{ name: 'Frontstead Real Estate' }],
  creator: 'Frontstead Real Estate',
  publisher: 'Frontstead Real Estate',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: 'your-google-verification-code',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://frontstead.com',
    siteName: 'Frontstead Real Estate',
    title: 'Frontstead Real Estate - Find Your Dream Home',
    description: 'Discover your perfect home with Frontstead Real Estate.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Frontstead Real Estate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@frontstead',
    creator: '@frontstead',
  },
};
```

### 2. Dynamic Sitemap Generation

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { getAllProperties, getAllCities, getAllNeighborhoods } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://frontstead.com';
  const now = new Date();

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  // Property pages
  const properties = await getAllProperties();
  const propertyPages = properties.map((property) => ({
    url: `${baseUrl}/${generatePropertySlug(property)}`,
    lastModified: new Date(property.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // City pages
  const cities = await getAllCities();
  const cityPages = cities.map((city) => ({
    url: `${baseUrl}/${city.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // Neighborhood pages
  const neighborhoods = await getAllNeighborhoods();
  const neighborhoodPages = neighborhoods.map((neighborhood) => ({
    url: `${baseUrl}/${neighborhood.city}/${neighborhood.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...propertyPages, ...cityPages, ...neighborhoodPages];
}
```

### 3. Robots.txt Configuration

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/_next/',
          '/temp/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: 'https://frontstead.com/sitemap.xml',
    host: 'https://frontstead.com',
  };
}
```

## Real Estate-Specific SEO Tactics

### 1. Property Schema Markup

```typescript
// utils/schema.ts
import { Property } from '@/types/property';

export function generatePropertySchema(property: Property) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.address,
    description: property.description,
    url: `https://frontstead.com/${generatePropertySlug(property)}`,
    image: property.images?.map(img => img.url) || [],

    // Property details
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.squareFeet,
      unitText: 'sqft',
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,

    // Pricing
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: property.listingDate,
    },

    // Location
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.zipCode,
      addressCountry: 'US',
    },

    // Geo coordinates
    geo: property.latitude && property.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: property.latitude,
      longitude: property.longitude,
    } : undefined,

    // Listing agent
    provider: {
      '@type': 'RealEstateAgent',
      name: property.agent?.name || 'Frontstead Real Estate',
      telephone: property.agent?.phone,
      email: property.agent?.email,
    },

    // Additional details
    yearBuilt: property.yearBuilt,
    occupancy: property.occupancy,
    propertyType: property.propertyType,
  };
}
```

### 2. Neighborhood Landing Pages

```typescript
// app/[city]/[neighborhood]/page.tsx
export async function generateMetadata({ params }: NeighborhoodPageProps): Promise<Metadata> {
  const neighborhood = await getNeighborhoodData(params.city, params.neighborhood);
  const properties = await getPropertiesByNeighborhood(params.neighborhood);

  return {
    title: `${neighborhood.name} Real Estate | Homes for Sale in ${neighborhood.name}, ${neighborhood.city}`,
    description: `Discover homes for sale in ${neighborhood.name}, ${neighborhood.city}. Browse ${properties.length} listings, explore neighborhood amenities, schools, and local insights.`,
    keywords: [
      `${neighborhood.name} real estate`,
      `homes for sale ${neighborhood.name}`,
      `${neighborhood.name} ${neighborhood.city} properties`,
      `buy home ${neighborhood.name}`,
      `${neighborhood.city} neighborhoods`,
    ],
    openGraph: {
      title: `${neighborhood.name} Real Estate | ${neighborhood.city}`,
      description: `Explore ${properties.length} homes for sale in ${neighborhood.name}. Find your perfect home in this desirable ${neighborhood.city} neighborhood.`,
      images: [{
        url: neighborhood.featuredImage || '/neighborhood-default.jpg',
        width: 1200,
        height: 630,
        alt: `${neighborhood.name} neighborhood in ${neighborhood.city}`,
      }],
    },
    alternates: {
      canonical: `https://frontstead.com/${params.city}/${params.neighborhood}`,
    },
  };
}
```

### 3. Search-Optimized Property Listing Pages

```typescript
// components/PropertyListingPage.tsx
import { generatePropertySchema } from '@/utils/schema';

export default function PropertyListingPage({ properties, city, state }: Props) {
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Homes for Sale in ${city}, ${state}`,
    description: `Browse ${properties.length} homes for sale in ${city}, ${state}`,
    url: `https://frontstead.com/${city.toLowerCase()}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: properties.length,
      itemListElement: properties.map((property, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: generatePropertySchema(property),
      })),
    },
  };

  return (
    <>
      <div className="property-listing-container">
        {/* Property listing content */}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
    </>
  );
}
```

## Technical SEO Optimization

### 1. Image Optimization

```typescript
// components/PropertyImage.tsx
import Image from 'next/image';

interface PropertyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export default function PropertyImage({
  src,
  alt,
  width = 800,
  height = 600,
  priority = false,
  className,
}: PropertyImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{
        objectFit: 'cover',
        width: '100%',
        height: 'auto',
      }}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    />
  );
}
```

### 2. Core Web Vitals Optimization

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.frontstead.com',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  // Enable SWC minification
  swcMinify: true,

  // Bundle analyzer
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(new BundleAnalyzerPlugin());
      return config;
    },
  }),
};

module.exports = nextConfig;
```

### 3. Performance Monitoring

```typescript
// components/WebVitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics
      gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }
  });

  return null;
}
```

## Content Strategy for Real Estate

### 1. Location-Based Content Hub

```typescript
// app/neighborhoods/[city]/page.tsx
export default async function CityPage({ params }: CityPageProps) {
  const cityData = await getCityData(params.city);
  const neighborhoods = await getNeighborhoods(params.city);
  const recentSales = await getRecentSales(params.city);
  const marketStats = await getMarketStats(params.city);

  return (
    <>
      <CityHero city={cityData} />
      <MarketOverview stats={marketStats} />
      <NeighborhoodGuide neighborhoods={neighborhoods} />
      <RecentSales sales={recentSales} />
      <LocalInsights city={cityData} />

      {/* Schema markup for the city page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateCitySchema(cityData, marketStats)),
        }}
      />
    </>
  );
}
```

### 2. SEO-Optimized Blog Content

```typescript
// Content strategy for real estate blog
const blogTopics = [
  // Buyer's guides
  'first-time-home-buyer-guide-[city]',
  'best-neighborhoods-families-[city]',
  'luxury-homes-guide-[city]',

  // Market insights
  '[city]-real-estate-market-trends-2024',
  'home-prices-[neighborhood]-analysis',
  'investment-properties-[city]-roi',

  // Local area guides
  'best-schools-near-[neighborhood]',
  'commute-guide-[city]-downtown',
  'restaurants-shopping-[neighborhood]',

  // Process guides
  'home-buying-process-[state]',
  'getting-mortgage-[city]',
  'home-inspection-checklist',
];
```

## Local SEO Optimization

### 1. Google Business Profile Integration

```typescript
// components/ContactInfo.tsx
export default function ContactInfo() {
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Frontstead Real Estate',
    image: 'https://frontstead.com/logo.jpg',
    telephone: '+1-555-123-4567',
    email: 'contact@frontstead.com',
    url: 'https://frontstead.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Main Street',
      addressLocality: 'Your City',
      addressRegion: 'Your State',
      postalCode: '12345',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '40.7128',
      longitude: '-74.0060',
    },
    openingHours: 'Mo-Fr 09:00-18:00, Sa 10:00-16:00',
    priceRange: '$$',
    areaServed: ['Your City', 'Neighboring City'],
  };

  return (
    <>
      {/* Contact information display */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
    </>
  );
}
```

### 2. Local Citations and NAP Consistency

```typescript
// Ensure consistent NAP (Name, Address, Phone) across all pages
export const businessInfo = {
  name: 'Frontstead Real Estate',
  address: {
    street: '123 Main Street',
    city: 'Your City',
    state: 'Your State',
    zip: '12345',
    country: 'United States',
  },
  phone: '+1-555-123-4567',
  email: 'contact@frontstead.com',
  website: 'https://frontstead.com',
  hours: {
    monday: '9:00 AM - 6:00 PM',
    tuesday: '9:00 AM - 6:00 PM',
    wednesday: '9:00 AM - 6:00 PM',
    thursday: '9:00 AM - 6:00 PM',
    friday: '9:00 AM - 6:00 PM',
    saturday: '10:00 AM - 4:00 PM',
    sunday: 'Closed',
  },
} as const;
```

## Performance & Core Web Vitals

### 1. Optimized Loading Strategy

```typescript
// components/PropertyCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Lazy load non-critical components
const PropertyDetails = dynamic(() => import('./PropertyDetails'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-40 rounded" />,
});

export default function PropertyCard({ property, priority = false }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <article className="property-card">
      <div className="relative aspect-w-16 aspect-h-9">
        <Image
          src={property.mainImage}
          alt={`${property.address} - Property for Sale`}
          fill
          priority={priority}
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <PropertyDetails property={property} />
    </article>
  );
}
```

### 2. Optimized Fonts and Assets

```typescript
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '700'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/hero-image.webp" as="image" />
        <link rel="dns-prefetch" href="https://images.frontstead.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
```

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Next.js App Router with TypeScript
- [ ] Configure metadata API in root layout
- [ ] Implement dynamic sitemap generation
- [ ] Set up robots.txt configuration
- [ ] Configure image optimization
- [ ] Implement font optimization

### Phase 2: Property Pages (Week 3-4)
- [ ] Create property slug generation function
- [ ] Implement dynamic property pages with `[address]` route
- [ ] Add property-specific metadata generation
- [ ] Implement property schema markup
- [ ] Set up image galleries with optimization
- [ ] Add structured data for listings

### Phase 3: Location Pages (Week 5-6)
- [ ] Create city landing pages
- [ ] Implement neighborhood pages
- [ ] Add location-based schema markup
- [ ] Create local market data integration
- [ ] Implement location-based search functionality

### Phase 4: Content & SEO (Week 7-8)
- [ ] Set up blog with real estate content
- [ ] Create neighborhood guides
- [ ] Implement internal linking strategy
- [ ] Add breadcrumb navigation
- [ ] Set up Google Analytics and Search Console
- [ ] Implement Web Vitals monitoring

### Phase 5: Advanced Features (Week 9-10)
- [ ] Add property comparison functionality
- [ ] Implement saved searches
- [ ] Create mortgage calculator
- [ ] Add property alerts
- [ ] Implement social sharing
- [ ] Set up email marketing integration

### Ongoing Optimization
- [ ] Monitor Core Web Vitals monthly
- [ ] Update content regularly
- [ ] Analyze search performance
- [ ] A/B test page layouts
- [ ] Monitor and improve page speed
- [ ] Track keyword rankings
- [ ] Analyze user behavior with heatmaps

## Key Metrics to Track

### SEO Performance
- Organic traffic growth
- Keyword ranking positions
- Click-through rates from SERPs
- Featured snippet captures
- Local pack rankings

### User Experience
- Core Web Vitals scores
- Page load times
- Bounce rate
- Time on page
- Property inquiry conversion rate

### Business Metrics
- Lead generation from organic search
- Property page views
- Contact form submissions
- Phone call tracking
- Virtual tour completions

## Advanced Tips

### 1. Competitive Analysis
- Monitor competitor rankings for target keywords
- Analyze their URL structures and content strategies
- Identify content gaps in your market
- Track their backlink acquisition

### 2. Schema Markup Testing
- Use Google's Rich Results Test tool
- Validate schema markup regularly
- Monitor rich snippet performance
- Test new schema types as they become available

### 3. International SEO (if applicable)
- Implement hreflang tags for multiple markets
- Create location-specific content
- Use geo-targeted keywords
- Consider separate domains vs. subfolders for different regions

This comprehensive guide provides a solid foundation for implementing world-class SEO in your Next.js real estate application. The address-based URL strategy you mentioned is indeed one of the best practices and will give you a significant competitive advantage in search results.