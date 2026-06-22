import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { AdminReport } from '@/types';
import { Loader2, AlertCircle, TrendingUp, DollarSign, ShoppingBag, CreditCard, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReports() {
    const [report, setReport] = useState<AdminReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get<AdminReport>('/admin/reports/');
            setReport(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, []);

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
                <button onClick={fetchReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </div>
        );
    }

    if (!report) return null;

    const kpis = [
        { label: 'Total Revenue', value: formatCurrency(report.total_revenue), icon: DollarSign, color: 'bg-green-50 text-green-600' },
        { label: 'Total Discounts', value: formatCurrency(report.total_discounts), icon: TrendingUp, color: 'bg-red-50 text-red-600' },
        { label: 'Total Orders', value: report.total_orders.toLocaleString(), icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
        { label: 'Avg Order Value', value: formatCurrency(report.avg_order_value), icon: CreditCard, color: 'bg-purple-50 text-purple-600' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Sales Report</h1>
                    <p className="text-sm text-gray-500 mt-1">Overview of sales performance</p>
                </div>
                <button
                    onClick={fetchReport}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-xl shadow-sm border p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{kpi.label}</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{kpi.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${kpi.color}`}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Sales by Payment Method
                </h2>
                {report.payment_methods.length === 0 ? (
                    <p className="text-sm text-gray-400">No payment data available</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-2 font-medium text-gray-600">Method</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">Orders</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.payment_methods.map((pm) => (
                                    <tr key={pm.method} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2 capitalize">{pm.method}</td>
                                        <td className="py-3 px-2 text-right">{pm.count}</td>
                                        <td className="py-3 px-2 text-right font-medium">{formatCurrency(pm.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Monthly Sales */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Monthly Sales
                </h2>
                {report.monthly_sales.length === 0 ? (
                    <p className="text-sm text-gray-400">No monthly data available</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-2 font-medium text-gray-600">Month</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">Orders</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.monthly_sales.map((ms) => (
                                    <tr key={ms.month} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2">{ms.month}</td>
                                        <td className="py-3 px-2 text-right">{ms.count}</td>
                                        <td className="py-3 px-2 text-right font-medium">{formatCurrency(ms.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}