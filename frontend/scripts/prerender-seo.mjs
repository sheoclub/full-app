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
      <main class="seo-prerender seo-prerender-home" data-prerendered="true">
        <section class="seo-hero">
          <p class="seo-eyebrow">Online ladies footwear store in Pakistan</p>
          <h1>Shoe Club Pakistan | Ladies Shoes Online</h1>
          <p>${defaultDescription}</p>
          <p>Shoe Club helps customers find fashionable and comfortable women footwear for daily wear, office looks, parties, weddings, and seasonal events. Shop heels, sandals, pumps, flats, wedges, slippers, and new arrivals with reliable delivery across Pakistan.</p>
          <p><a href="/shop">Shop ladies shoes online</a></p>
        </section>
        <section>
          <h2>Popular Ladies Shoes Categories</h2>
          <ul>
            <li><a href="/shop">Heels for formal events, parties, and weddings</a></li>
            <li><a href="/shop">Sandals and flats for comfortable everyday wear</a></li>
            <li><a href="/shop">Pumps, wedges, and stylish footwear for work and casual outfits</a></li>
            <li><a href="/shop">New arrivals and sale footwear deals in Pakistan</a></li>
          </ul>
        </section>
        <section>
          <h2>Why Shop From Shoe Club?</h2>
          <p>Customers choose Shoe Club for stylish designs, clear product details, size and color options, customer support, order tracking, shipping information, and an easy return policy.</p>
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
      <main class="seo-prerender seo-prerender-shop" data-prerendered="true">
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Shop</span></nav>
        <section>
          <h1>Shop Ladies Shoes Online</h1>
          <p>Browse ladies shoes, heels, sandals, pumps, flats, and new arrivals online at Shoe Club Pakistan.</p>
          <p>The Shoe Club shop page is the main collection page for women footwear in Pakistan. Customers can explore comfortable daily shoes, stylish party wear heels, formal pumps, casual sandals, flat shoes, wedges, and seasonal sale items.</p>
        </section>
        <section>
          <h2>Find Women Footwear By Style</h2>
          <ul>
            <li>Heels for parties, weddings, formal looks, and special occasions</li>
            <li>Comfortable sandals, flats, and slippers for everyday wear</li>
            <li>Pumps and office footwear for smart daily outfits</li>
            <li>New arrivals, featured products, and discounted shoes</li>
          </ul>
        </section>
        <section>
          <h2>Online Shoe Shopping In Pakistan</h2>
          <p>Every product page includes product name, price, description, images, available colors, sizes, reviews, and SEO metadata so Google can understand the collection and product details.</p>
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
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>About</span></nav>
        <h1>About Shoe Club Pakistan</h1>
        <p>Shoe Club Pakistan is an online ladies footwear store focused on stylish, comfortable, and practical shoes for women across Pakistan.</p>
        <p>Our catalog includes heels, sandals, pumps, flats, wedges, slippers, new arrivals, and seasonal deals for customers who want dependable footwear and clear online shopping information.</p>
        <h2>Our Footwear Promise</h2>
        <p>We aim to provide useful product details, reliable customer support, transparent shipping information, and easy order tracking so customers can shop with confidence.</p>
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
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Contact</span></nav>
        <h1>Contact Shoe Club Pakistan</h1>
        <p>Contact Shoe Club Pakistan for order questions, product information, delivery support, payment questions, returns, and customer service.</p>
        <h2>Customer Support</h2>
        <p>Customers can use the contact page to send a message about an order, ask about sizes or colors, request return help, or get assistance before buying ladies shoes online.</p>
        <h2>Shopping Help</h2>
        <p>Our team supports customers with product details, order tracking, shipping updates, and after-sale questions.</p>
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
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Shipping Information</span></nav>
        <h1>Shipping Information</h1>
        <p>Find delivery and shipping information for online shoe orders from Shoe Club Pakistan.</p>
        <h2>Delivery Across Pakistan</h2>
        <p>Shoe Club provides delivery support for customers ordering ladies shoes online. Shipping details, available delivery options, and order updates help customers understand when their footwear will arrive.</p>
        <h2>Order Processing</h2>
        <p>Orders are reviewed and processed with product, size, color, payment, and delivery information so customers receive the correct footwear.</p>
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
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Return Policy</span></nav>
        <h1>Return Policy</h1>
        <p>Read Shoe Club Pakistan return policy for eligible 7-day returns, outlet visits, and WhatsApp support.</p>
        <h2>Return Support</h2>
        <p>The return policy explains eligibility, return timing, product condition, outlet visit guidance, and support channels for customers who need help after receiving a footwear order.</p>
        <h2>Customer Confidence</h2>
        <p>Clear return information helps customers shop ladies shoes online with confidence and understand what to do if an issue occurs.</p>
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
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Track Order</span></nav>
        <h1>Track Your Order</h1>
        <p>Track your Shoe Club Pakistan order status online with your order details.</p>
        <h2>Order Status Updates</h2>
        <p>Customers can check order progress after buying ladies shoes online, including processing, shipping, delivery, and support information.</p>
        <h2>Need Help With An Order?</h2>
        <p>If order tracking needs additional support, customers can contact Shoe Club for delivery, payment, or product-related questions.</p>
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
  output = upsertHeadTag(output, /<meta[^>]*name=["']robots["'][^>]*>/i, '<meta data-rh="true" name="robots" content="index, follow, max-image-preview:large" />');
  output = upsertHeadTag(output, /<link[^>]*rel=["']canonical["'][^>]*>/i, `<link data-rh="true" rel="canonical" href="${canonical}" />`);
  output = upsertHeadTag(output, /<meta[^>]*property=["']og:type["'][^>]*>/i, '<meta data-rh="true" property="og:type" content="website" />');
  output = upsertHeadTag(output, /<meta[^>]*property=["']og:title["'][^>]*>/i, `<meta data-rh="true" property="og:title" content="${title}" />`);
  output = upsertHeadTag(output, /<meta[^>]*property=["']og:description["'][^>]*>/i, `<meta data-rh="true" property="og:description" content="${description}" />`);
  output = upsertHeadTag(output, /<meta[^>]*property=["']og:url["'][^>]*>/i, `<meta data-rh="true" property="og:url" content="${canonical}" />`);
  output = upsertHeadTag(output, /<meta[^>]*name=["']twitter:title["'][^>]*>/i, `<meta data-rh="true" name="twitter:title" content="${title}" />`);
  output = upsertHeadTag(output, /<meta[^>]*name=["']twitter:description["'][^>]*>/i, `<meta data-rh="true" name="twitter:description" content="${description}" />`);
  return output.replace('<div id="root"></div>', `<div id="root">${route.content}\n  </div>`);
}

function applyNoIndex(html) {
  let output = html;
  output = upsertHeadTag(output, /<title[^>]*>.*?<\/title>/i, '<title data-rh="true">Page Not Found | Shoe Club Pakistan</title>');
  output = upsertHeadTag(output, /<meta[^>]*name=["']description["'][^>]*>/i, '<meta data-rh="true" name="description" content="The requested Shoe Club Pakistan page was not found." />');
  output = upsertHeadTag(output, /<meta[^>]*name=["']robots["'][^>]*>/i, '<meta data-rh="true" name="robots" content="noindex, nofollow" />');
  return output.replace('<div id="root"></div>', `<div id="root">
      <main class="seo-prerender seo-404" data-prerendered="true">
        <h1>Page Not Found</h1>
        <p>The requested Shoe Club Pakistan page does not exist. Please visit the shop page for ladies shoes, heels, sandals, pumps, flats, and new arrivals.</p>
        <p><a href="/shop">Go to Shoe Club Shop</a></p>
      </main>
  </div>`);
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
  const category = stripTags(product.category_name || product.category_detail?.name || 'Ladies Shoes');
  const price = product.price ? `PKR ${stripTags(product.price)}` : '';
  const description = stripTags(product.meta_description || product.description || `${name} is available online at Shoe Club Pakistan.`);
  return {
    path: `/product/${slug}`,
    title: product.meta_title || `${name} | Shoe Club Pakistan`,
    description,
    priority: '0.8',
    changefreq: 'weekly',
    content: `
      <main class="seo-prerender seo-prerender-product" data-prerendered="true">
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/shop">Shop</a> / <span>${escapeHtml(name)}</span></nav>
        <article>
          <h1>${escapeHtml(name)}</h1>
          <p>${escapeHtml(description)}</p>
          <dl>
            <dt>Category</dt><dd>${escapeHtml(category)}</dd>
            ${price ? `<dt>Price</dt><dd>${escapeHtml(price)}</dd>` : ''}
          </dl>
          <h2>Buy ${escapeHtml(name)} Online</h2>
          <p>${escapeHtml(name)} is part of the Shoe Club Pakistan ladies footwear collection. Visit this product page for images, size options, color options, price, reviews, availability, and checkout details.</p>
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
  await fs.writeFile(new URL('404.html', DIST_DIR), applyNoIndex(template));
  await fs.writeFile(new URL('sitemap.xml', DIST_DIR), sitemap(routes));
  console.log(`[seo] Prerendered ${routes.length} indexable routes and a noindex 404 page.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
