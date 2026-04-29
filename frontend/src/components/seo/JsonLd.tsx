interface OrganizationJsonLdProps { type: 'Organization' }
interface WebSiteJsonLdProps { type: 'WebSite' }
interface ProductJsonLdProps {
  type: 'Product';
  name: string;
  description?: string;
  image?: string;
  sku?: string;
  price: number;
  currency?: string;
  availability: 'InStock' | 'OutOfStock';
  brand?: string;
  ratingValue?: number;
  reviewCount?: number;
  url: string;
}
interface BreadcrumbJsonLdProps {
  type: 'BreadcrumbList';
  items: { name: string; url: string }[];
}

type JsonLdProps =
  | OrganizationJsonLdProps
  | WebSiteJsonLdProps
  | ProductJsonLdProps
  | BreadcrumbJsonLdProps;

const SITE = 'https://souqalqadam.com';

function buildSchema(props: JsonLdProps): object {
  switch (props.type) {
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Souq Al Qadam',
        url: SITE,
        logo: `${SITE}/logo/logo.png`,
        sameAs: [],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          areaServed: 'BD',
          availableLanguage: ['English', 'Bengali'],
        },
      };

    case 'WebSite':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Souq Al Qadam',
        url: SITE,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/products?search={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      };

    case 'Product': {
      const schema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: props.name,
        url: props.url,
        offers: {
          '@type': 'Offer',
          price: props.price.toFixed(2),
          priceCurrency: props.currency ?? 'BDT',
          availability: `https://schema.org/${props.availability}`,
          url: props.url,
        },
      };
      if (props.description) schema.description = props.description;
      if (props.image)       schema.image       = props.image;
      if (props.sku)         schema.sku         = props.sku;
      if (props.brand)       schema.brand       = { '@type': 'Brand', name: props.brand };
      if (props.ratingValue && props.reviewCount) {
        schema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: props.ratingValue.toFixed(1),
          reviewCount: props.reviewCount,
          bestRating: 5,
          worstRating: 1,
        };
      }
      return schema;
    }

    case 'BreadcrumbList':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: props.items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      };
  }
}

export default function JsonLd(props: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSchema(props)) }}
    />
  );
}
