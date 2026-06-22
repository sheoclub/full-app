import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { AdminAnalytics } from '@/types';
import { Loader2, AlertCircle, TrendingUp, Package, Users, ShoppingCart, BarChart3 } from 'lucide-react';

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AdminAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: res } = await api.get<AdminAnalytics>('/admin/analytics/');
            setData(res);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnalytics(); }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-3">
                <AlertCircle className="w-10 h-10" />
                <p>{error}</p>
                <button onClick={fetchAnalytics} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Product performance, category trends & user growth</p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Top 10 Products by Sales
                </h2>
                {data.top_products.length === 0 ? (
                    <p className="text-sm text-gray-400">No product sales data</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-2 font-medium text-gray-600">#</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-600">Product</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">Units Sold</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.top_products.map((p, idx) => (
                                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2 text-gray-400">{idx + 1}</td>
                                        <td className="py-3 px-2 font-medium">{p.name}</td>
                                        <td className="py-3 px-2 text-right">{p.total_qty}</td>
                                        <td className="py-3 px-2 text-right font-medium">{formatCurrency(p.total_revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Category Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border p-5">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-500" />
                        Category Sales
                    </h2>
                    {data.category_sales.length === 0 ? (
                        <p className="text-sm text-gray-400">No category data</p>
                    ) : (
                        <div className="space-y-3">
                            {data.category_sales.map((cs) => (
                                <div key={cs.category} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">{cs.category}</span>
                                    <span className="text-sm font-medium text-gray-800">{formatCurrency(cs.total)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Users Per Month */}
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-500" />
                            Users Per Month
                        </h2>
                        {data.users_per_month.length === 0 ? (
                            <p className="text-sm text-gray-400">No user signup data</p>
                        ) : (
                            <div className="space-y-3">
                                {data.users_per_month.map((u) => (
                                    <div key={u.month} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">{u.month}</span>
                                        <span className="text-sm font-medium text-gray-800">{u.count} new</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Orders Per Month */}
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-orange-500" />
                            Orders Per Month
                        </h2>
                        {data.orders_per_month.length === 0 ? (
                            <p className="text-sm text-gray-400">No order data</p>
                        ) : (
                            <div className="space-y-3">
                                {data.orders_per_month.map((o) => (
                                    <div key={o.month} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">{o.month}</span>
                                        <span className="text-sm font-medium text-gray-800">{o.count} orders</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}