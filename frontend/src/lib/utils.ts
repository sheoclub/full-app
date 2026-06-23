export function formatCurrency(amount: string | number, currency = 'PKR'): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function truncate(str: string, len = 100): string {
    if (str.length <= len) return str;
    return str.substring(0, len) + '...';
}

export function getImageUrl(url: string | null | undefined, fallback = 'https://via.placeholder.com/300x300?text=No+Image'): string {
    if (!url) return fallback;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/media/') || url.startsWith('/static/')) return url;
    // Raw filenames from save_upload() need /media/ prefix
    return '/media/' + url;
}

export const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
    Pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    Confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    Processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-800' },
    Shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
    Delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
    Cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    Returned: { label: 'Returned', color: 'bg-orange-100 text-orange-800' },
    Refunded: { label: 'Refunded', color: 'bg-pink-100 text-pink-800' },
    Completed: { label: 'Completed', color: 'bg-teal-100 text-teal-800' },
};

export const PAYMENT_STATUSES: Record<string, { label: string; color: string }> = {
    Unpaid: { label: 'Unpaid', color: 'bg-gray-100 text-gray-800' },
    Pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    Paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
    Partial: { label: 'Partial', color: 'bg-blue-100 text-blue-800' },
    Rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
    Refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-800' },
};

export const PAYMENT_METHODS: Record<string, string> = {
    cod: 'Cash on Delivery',
    online: 'Online Payment',
    card: 'Card Payment',
    jazzcash: 'JazzCash',
    easypaisa: 'EasyPaisa',
    bank_transfer: 'Bank Transfer',
};

export function getStatusBadge(status: string, type: 'order' | 'payment'): { label: string; className: string } {
    const map = type === 'order' ? ORDER_STATUSES : PAYMENT_STATUSES;
    const normalizedStatus = Object.keys(map).find((key) => key.toLowerCase() === String(status).toLowerCase());
    const entry = map[status] || (normalizedStatus ? map[normalizedStatus] : undefined) || { label: status, color: 'bg-gray-100 text-gray-800' };
    return { label: entry.label, className: `inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.color}` };
}