import { useEffect, useState } from 'react';
import { ArrowLeft, Shield, RotateCcw, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { SiteSettings } from '@/types';

export default function ReturnPolicyPage() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        api.get('/settings/')
            .then((res) => setSettings(res.data))
            .catch(() => { });
    }, []);

    return (
        <div className="min-h-screen">
            <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Return Policy</h1>
                    <p className="text-xl text-blue-100">7-day easy return policy for your peace of mind</p>
                </div>
            </section>

            <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <RotateCcw className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">7 Days Return</h3>
                        <p className="text-gray-600 text-sm">Return unworn items within 7 days of delivery</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Full Refund</h3>
                        <p className="text-gray-600 text-sm">Get a full refund or store credit for eligible returns</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Quality Check</h3>
                        <p className="text-gray-600 text-sm">All items are inspected before refund is processed</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Return & Exchange Policy</h2>
                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p>
                                At Shoe Club, customer satisfaction is our top priority. If you're not completely
                                satisfied with your purchase, we offer a 7-day return policy from the date of delivery.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Eligible for Return
                        </h3>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                Items must be unworn, unwashed, and in original condition.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                Original packaging must be intact and included.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                Return request must be initiated within 7 days of delivery.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                Defective or incorrect items are always eligible for return.
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Not Eligible for Return
                        </h3>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">✗</span>
                                Items that have been worn, used, or washed.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">✗</span>
                                Items without original tags or packaging.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">✗</span>
                                Sale or clearance items (unless defective).
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">✗</span>
                                Returns initiated after 7 days of delivery.
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Return</h3>
                        <ol className="space-y-3 text-gray-600 list-decimal list-inside">
                            <li>Contact our support team within 7 days of delivery.</li>
                            <li>Provide your order number and reason for return.</li>
                            <li>Pack the item securely with original packaging.</li>
                            <li>Ship the item back to our return address (we will share details).</li>
                            <li>Once received and inspected, refund is processed within 3-5 business days.</li>
                        </ol>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Refund Processing</h3>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                Refunds are processed within 3-5 business days after item inspection.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                Refunds are issued to the original payment method.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                For COD orders, refund is processed via bank transfer (provide IBAN).
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                Store credit is issued immediately upon approval if preferred.
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                To request a return under our 7-day policy, please contact us on WhatsApp at {settings?.contact_phone || 'the number listed on our website'} or visit our outlet at {settings?.contact_address || 'the address listed on our website'} with a valid reason and the item in eligible condition.
                            </li>
                        </ul>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-gray-900 mb-1">Important Note</h4>
                            <p className="text-sm text-gray-600">
                                Return shipping costs are borne by the customer unless the item is defective or
                                incorrect. We recommend using a trackable shipping service for returns.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link
                        to="/contact"
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                        Need help? Contact us →
                    </Link>
                </div>
            </section>
        </div>
    );
}