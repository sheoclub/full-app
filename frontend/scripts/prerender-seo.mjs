import fs from 'node:fs/promises';

const SITE_URL = process.env.SITE_URL || 'https://sheoclub.vercel.app';
const API_ORIGIN = (process.env.SITEMAP_API_ORIGIN || process.env.VITE_API_ORIGIN || SITE_URL).replace(/\/$/, '');
const DIST_DIR = new URL('../dist/', import.meta.url);
const INDEX_FILE = new URL('index.html', DIST_DIR);

const defaultDescription = 'Shop stylish ladies shoes online in Pakistan at Shoe Club. Discover heels, sandals, pumps, flats, and everyday footwear with reliable delivery.';

const publicRoutes = [
  {
    path: '/',
    title: 'Shoe Club Pakistan | Ladies Shoes Online',
    description: defaultDescription,
    priority: '1.0',
    changefreq: 'daily',
    content: `
      <main class="seo-prerender" data-prerendered="true">
        <section>
          <h1>Shoe Club Pakistan | Ladies Shoes Online</h1>
          <p>${defaultDescription}</p>
          <p>Explore premium ladies shoes, heels, sandals, pumps, flats, new arrivals, sale products, and comfortable everyday footwear with reliable delivery across Pakistan.</p>
          <p><a href="/shop">Shop ladies shoes online</a></p>
        </section>
      </main>`,
  },
  {
    path: '/shop',
    title: 'Shop Ladies Shoes Online | Shoe Club Pakistan',
    description: 'Browse ladies shoes, heels, sandals, pumps, flats, and new arrivals online at Shoe Club Pakistan.',
    priority: '0.9',
    changefreq: 'daily',
    content: `
      <main class="seo-prerender" data-prerendered="true">
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Shop</span></nav>
        <section>
          <h1>Shop Ladies Shoes Online</h1>
          <p>Browse ladies shoes, heels, sandals, pumps, flats, and new arrivals online at Shoe Club Pakistan.</p>
          <ul>
            <li>Heels for parties, weddings, and formal events</li>
            <li>Comfortable sandals and flats for everyday wear</li>
            <li>Pumps and stylish footwear with fast delivery in Pakistan</li>
          </ul>
        </section>
      </main>`,
  },
  {
    path: '/about',
    title: 'About Shoe Club Pakistan',
    description: 'Learn about Shoe Club Pakistan and our collection of stylish, comfortable ladies footwear.',
    priority: '0.6',
    changefreq: 'monthly',
    content: `
      <main class="seo-prerender" data-prerendered="true">
        <h1>About Shoe Club Pakistan</h1>
        <p>Learn about Shoe Club Pakistan and our collection of stylish, comfortable ladies footwear for customers across Pakistan.</p>
      </main>`,
  },
  {
    path: '/contact',
    title: 'Contact Shoe Club Pakistan',
    description: 'Contact Shoe Club Pakistan for orders, returns, delivery questions, and customer support.',
    priority: '0.6',
    changefreq: 'monthly',
    content: `
      <main class="seo-prerender" data-prerendered="true">
        <h1>Contact Shoe Club Pakistan</h1>
        <p>Contact Shoe Club Pakistan for orders, returns, delivery questions, and customer support.</p>
      </main>`,
  },
  {
    path: '/shipping-info',
    title: 'Shipping Information | Shoe Club Pakistan',
    description: 'Find delivery and shipping information for online shoe orders from Shoe Club Pakistan.',
    priority: '0.5',
    changefreq: 'monthly',
    content: `
      <main class="seo-prerender" data-prerendered="true">
        <h1>Shipping Information</h1>
        <p>Find delivery and shipping information for online shoe orders from Shoe Club Pakistan.</p>
      </main>`,
  },
  {
    path: '/return-policy',
    title: 'Return Policy | Shoe Club Pakistan',
    description: 'Read Shoe Club Pakistan return policy for eligible 7-day returns, outlet visits, and WhatsApp support.',
    priority: '0.5',
    changefreq: 'monthly',
    content: `
      <main class="seo-prerender" data-prerendered="true">
        <h1>Return Policy</h1>
        <p>Read Shoe Club Pakistan return policy for eligible 7-day returns, outlet visits, and WhatsApp support.</p>
      </main>`,
  },
  {
    path: '/track-order',
    title: 'Track Your Order | Shoe Club Pakistan',
    description: 'Track your Shoe Club Pakistan order status online with your order details.',
    priority: '0.4',
    changefreq: 'monthly',
    content: `
      <main class="seo-prerender" data-prerendered="true">
        <h1>Track Your Order</h1>
        <p>Track your Shoe Club Pakistan order status online with your order details.</p>
      </main>`,
  },
];

function canonicalFor(pathname) {
  return `${SITE_URL.replace(/\/$/, '')}${pathname === '/' ? '/' : pathname}`;
}

function escapeHtml(value = '') {
  const entities = {
    '&': '&' + 'amp;',
    '<': '&' + 'lt;',
    '>': '&' + 'gt;',
    '"': '&' + 'quot;',
    "'": '&' + '#39;',
  };
  return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}

function stripTags(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function upsertHeadTag(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace('</head>', `  ${replacement}\n</head>`);
}

function applySeo(html, route) {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const canonical = canonicalFor(route.path);

  let output = html;
  output = upsertHeadTag(output, /<title[^>]*>.*?<\/title>/i, `<title data-rh="true">${title}</title>`);
  output = upsertHeadTag(output, /<meta[^>]*name=["']description["'][^>]*>/i, `<meta data-rh="true" name="description" content="${description}" />`);
  output = upsertHeadTag(output, /<meta[^>]*name=["']robots["'][^>]*>/i, '<meta data-rh="true" name="robots" content="index, follow" />');
  output = upsertHeadTag(output, /<link[^>]*rel=["']canonical["'][^>]*>/i, `<link data-rh="true" rel="canonical" href="${canonical}" />`);
  output = upsertHeadTag(output, /<meta[^>]*property=["']og:type["'][^>]*>/i, '<meta data-rh="true" property="og:type" content="website" />');
  output = upsertHeadTag(output, /<meta[^>]*property=["']og:title["'][^>]*>/i, `<meta data-rh="true" property="og:title" content="${title}" />`);
  output = upsertHeadTag(output, /<meta[^>]*property=["']og:description["'][^>]*>/i, `<meta data-rh="true" property="og:description" content="${description}" />`);
  output = upsertHeadTag(output, /<meta[^>]*property=["']og:url["'][^>]*>/i, `<meta data-rh="true" property="og:url" content="${canonical}" />`);
  output = upsertHeadTag(output, /<meta[^>]*name=["']twitter:title["'][^>]*>/i, `<meta data-rh="true" name="twitter:title" content="${title}" />`);
  output = upsertHeadTag(output, /<meta[^>]*name=["']twitter:description["'][^>]*>/i, `<meta data-rh="true" name="twitter:description" content="${description}" />`);
  return output.replace('<div id="root"></div>', `<div id="root">${route.content}\n  </div>`);
}

async function writeRoute(route, template) {
  const html = applySeo(template, route);
  const outputUrl = route.path === '/' ? INDEX_FILE : new URL(`.${route.path}/index.html`, DIST_DIR);
  await fs.mkdir(new URL('.', outputUrl), { recursive: true });
  await fs.writeFile(outputUrl, html);
}

async function fetchProducts() {
  try {
    const response = await fetch(`${API_ORIGIN}/api/products/?page_size=100`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch (error) {
    console.warn(`[seo] Product sitemap/prerender skipped: ${error.message}`);
    return [];
  }
}

function productRoute(product) {
  const slug = product.slug;
  const name = stripTags(product.name || 'Shoe Club Product');
  const description = stripTags(product.meta_description || product.description || `${name} is available online at Shoe Club Pakistan.`);
  return {
    path: `/product/${slug}`,
    title: product.meta_title || `${name} | Shoe Club Pakistan`,
    description,
    priority: '0.8',
    changefreq: 'weekly',
    content: `
      <main class="seo-prerender" data-prerendered="true">
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/shop">Shop</a> / <span>${escapeHtml(name)}</span></nav>
        <article>
          <h1>${escapeHtml(name)}</h1>
          <p>${escapeHtml(description)}</p>
          ${product.price ? `<p>Price: PKR ${escapeHtml(product.price)}</p>` : ''}
          <p><a href="/product/${escapeHtml(slug)}">View product details</a></p>
        </article>
      </main>`,
  };
}

function sitemap(routes) {
  const urls = routes.map((route) => `  <url>\n    <loc>${canonicalFor(route.path)}</loc>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function main() {
  const template = await fs.readFile(INDEX_FILE, 'utf8');
  const products = await fetchProducts();
  const productRoutes = products.filter((product) => product.slug).map(productRoute);
  const routes = [...publicRoutes, ...productRoutes];

  await Promise.all(routes.map((route) => writeRoute(route, template)));
  await fs.writeFile(new URL('sitemap.xml', DIST_DIR), sitemap(routes));
  console.log(`[seo] Prerendered ${routes.length} routes with route-specific SEO.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
