export interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    city: string;
    is_staff: boolean;
    is_suspended: boolean;
    is_active: boolean;
    date_joined: string;
    order_count: number;
}

export interface Category {
    id: number;
    name: string;
    slug?: string;
    description?: string;
    image?: string;
    sort_order?: number;
    is_active?: boolean;
    discount_percentage?: number;
    product_count?: number;
    created_at?: string;
}

export interface Brand {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    website?: string;
    is_active: boolean;
    product_count?: number;
    created_at?: string;
}

export interface ProductImage {
    id: number;
    image: string;
    alt_text: string;
    sort_order: number;
}

export interface ProductVariant {
    id: number;
    size: string;
    color: string;
    color_code: string;
    sku: string;
    price_override: string | null;
    effective_price: string;
    stock: number;
    image: string;
    is_active: boolean;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: string;
    compare_price: string | null;
    discount_percentage: number;
    retail_price: string;
    profit_percentage: number;
    stock: number;
    status: boolean;
    category: number;
    category_name: string;
    category_detail?: Category;
    brand: number | null;
    brand_name: string | null;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    images: ProductImage[];
    variants: ProductVariant[];
    thumbnail: string;
    thumbnail_url: string;
    average_rating: number;
    review_count: number;
    is_featured: boolean;
    has_variants: boolean;
    free_delivery: boolean;
    min_quantity: number;
    delivery_charge: string;
    specifications: Record<string, string>;
    tags: string[];
    created_at: string;
}

export interface Review {
    id: number;
    product: number;
    user: number;
    user_name: string;
    rating: number;
    comment: string;
    is_approved: boolean;
    created_at: string;
}

export interface WishlistItem {
    id: number;
    product: number;
    product_detail: Product;
    added_at: string;
}

export interface Banner {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    link_url: string;
    banner_type: string;
    active: boolean;
    sort_order: number;
    product: number | null;
    created_at: string;
}

export interface Coupon {
    id: number;
    code: string;
    discount_type: string;
    discount_value: string;
    min_order_amount: string;
    max_uses: number;
    used_count: number;
    is_active: boolean;
    is_gift: boolean;
    auto_generated: boolean;
    description: string;
    assigned_to: number | null;
    categories: number[];
    valid_from: string;
    valid_to: string;
    is_valid: boolean;
    created_at: string;
    batch_id: string | null;
    emailed_at: string | null;
}

export interface UserNotification {
    id: number;
    subject: string;
    body: string;
    is_read: boolean;
    coupon: number | null;
    coupon_code: string | null;
    coupon_discount: string | null;
    review: number | null;
    review_detail: Review | null;
    created_at: string;
}

export interface CartItem {
    product: {
        id: number;
        name: string;
        slug: string;
        image: string;
        price: string;
        compare_price: string | null;
        stock: number;
        min_quantity: number;
        delivery_charge: string;
    };
    quantity: number;
    total_price: string;
    subtotal: string;
    variant?: {
        id: number;
        size: string;
        color: string;
    };
}

export interface Cart {
    items: CartItem[];
    total: string;
    item_count: number;
}

export interface OrderItem {
    id: number;
    product: number | null;
    product_name: string;
    name?: string;
    thumbnail: string;
    product_image?: string;
    image?: string;
    variant?: number | null;
    variant_detail?: ProductVariant | null;
    price: string;
    quantity: number;
    total: string;
    subtotal: string;
}

export interface Order {
    id: number;
    user: User & { name?: string };
    user_name: string;
    user_email: string;
    customer_name: string;
    customer_email: string;
    items: OrderItem[];
    subtotal: string;
    total: string;
    final_total: string;
    discount_amount: string;
    discount: string;
    shipping_cost: string;
    paid_amount: string;
    due_amount: string;
    coupon: string | null;
    coupon_code: string | null;
    shipping_address: string;
    city: string;
    phone: string;
    payment_method: string;
    payment_status: string;
    order_status: string;
    tracking_number: string;
    transaction_id: string;
    payment_proof: string;
    payment_proof_url: string[];
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface DeliveryChargeTier {
    id: number;
    delivery_charge: number;
    min_quantity: number;
    max_quantity: number | null;
    charge: string;
}

export interface DeliveryCharge {
    id: number;
    province: string;
    city: string;
    charge: string;
    min_order_for_free: string;
    is_active: boolean;
    effective_charge: string;
    tiers: DeliveryChargeTier[];
}

export interface ProvinceOption {
    value: string;
    label: string;
}

export interface Announcement {
    id: number;
    message: string;
    active: boolean;
    is_flash_sale: boolean;
    created_at: string;
}

export interface ContactMessage {
    id: number;
    user: number | null;
    user_name: string;
    user_email: string;
    email: string;
    subject: string;
    message: string;
    reply: string;
    is_read: boolean;
    created_at: string;
}

export interface SiteSettings {
    site_name: string;
    logo_url: string;
    site_logo: string;
    site_favicon: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    facebook_url: string;
    instagram_url: string;
    twitter_url: string;
    linkedin_url: string;
    youtube_url: string;
    currency: string;
    delivery_charge: string;
    free_delivery_min: string;
    about_text: string;
    about_photo: string;
    top_banner_text: string;
    [key: string]: string;
}

export interface DashboardStats {
    total_products: number;
    total_users: number;
    total_orders: number;
    total_revenue: string;
    total_profit: string;
    pending_orders: number;
    pending_payments: number;
    low_stock: number;
    recent_orders: Order[];
}

export interface AdminReport {
    total_revenue: number;
    total_discounts: number;
    total_orders: number;
    avg_order_value: number;
    payment_methods: { method: string; total: number; count: number }[];
    monthly_sales: { month: string; total: number; count: number }[];
}

export interface AdminAnalytics {
    top_products: { name: string; id: number; total_qty: number; total_revenue: number }[];
    category_sales: { category: string; total: number }[];
    users_per_month: { month: string; count: number }[];
    orders_per_month: { month: string; count: number }[];
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'returned'
    | 'refunded'
    | 'completed';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'cod' | 'online' | 'card' | 'jazzcash' | 'easypaisa' | 'bank_transfer';