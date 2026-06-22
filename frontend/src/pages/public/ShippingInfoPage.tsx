import { Truck, Package, Clock, MapPin, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ShippingInfoPage() {
    return (
        <div className="min-h-screen">
            <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Shipping Information</h1>
                    <p className="text-xl text-blue-100">Everything you need to know about delivery</p>
                </div>
            </section>

            <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                            <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Free Delivery</h3>
                        <p className="text-gray-600 text-sm">Free shipping on all orders above Rs. 2,500. Standard delivery applies.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                            <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Delivery Time</h3>
                        <p className="text-gray-600 text-sm">2-5 business days for major cities, 5-7 days for regional areas.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                            <Package className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Order Tracking</h3>
                        <p className="text-gray-600 text-sm">Track your order in real-time from the dashboard after dispatch.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                            <MapPin className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Coverage Area</h3>
                        <p className="text-gray-600 text-sm">We deliver to all cities and towns across Pakistan.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Delivery Policy</h2>
                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p>
                                At Shoe Club, we strive to ensure your order reaches you as quickly and safely as
                                possible. We partner with reliable courier services to deliver across Pakistan.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Processing Time</h3>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                Orders are processed within 24-48 hours after confirmation.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                Orders placed on weekends or public holidays are processed on the next business day.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                You will receive a confirmation email once your order is processed.
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Shipping Charges</h3>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                Free shipping on orders above Rs. 2,500.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                Standard shipping fee of Rs. 150 applies to orders below Rs. 2,500.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                No hidden charges — all fees are displayed at checkout.
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Delivery Timeline</h3>
                        <div className="overflow-hidden rounded-xl border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 text-left font-medium text-gray-700">Location</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700">Estimated Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="px-4 py-3 text-gray-600">Major Cities (Karachi, Lahore, Islamabad)</td>
                                        <td className="px-4 py-3 text-gray-600">2-3 business days</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-gray-600">Other Cities</td>
                                        <td className="px-4 py-3 text-gray-600">3-5 business days</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-gray-600">Remote Areas</td>
                                        <td className="px-4 py-3 text-gray-600">5-7 business days</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                        <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-gray-900 mb-1">Safe Delivery Guarantee</h4>
                            <p className="text-sm text-gray-600">
                                If your package arrives damaged, we will replace it free of charge. Contact our support
                                team within 48 hours of delivery with photos of the damage.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link
                        to="/return-policy"
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                        View our Return Policy →
                    </Link>
                </div>
            </section>
        </div>
    );
}