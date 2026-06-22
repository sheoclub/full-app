import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Shield, Truck, Headphones, Star, Award, Heart } from 'lucide-react';
import api from '../../lib/api';
import { getImageUrl } from '../../lib/utils';
import type { SiteSettings } from '../../types';

export default function AboutPage() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/settings/')
            .then((res) => setSettings(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen">
            {/* Hero Banner */}
            <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        About {settings?.site_name || 'Shoe Club'}
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Your premier destination for premium footwear since 2020
                    </p>
                </div>
            </section>

            {/* Mission & Story */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            {settings?.about_text || 'Shoe Club was founded with a simple mission: to bring the best footwear from around the world to your doorstep. We believe that great shoes have the power to transform not just your outfit, but your entire day.'}
                        </p>
                        <p className="text-gray-600 leading-relaxed mb-6">
                            From humble beginnings as a small online store, we've grown into a trusted destination for thousands of happy customers. Every pair we sell is carefully selected for quality, comfort, and style.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Award className="w-5 h-5" />
                                <span className="font-medium">Premium Quality</span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-600">
                                <Heart className="w-5 h-5" />
                                <span className="font-medium">100% Satisfaction</span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-600">
                                <Star className="w-5 h-5" />
                                <span className="font-medium">Top Rated</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="aspect-square rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-blue-50 to-indigo-100">
                            {settings?.about_photo_url ? (
                                <img
                                    src={getImageUrl(settings.about_photo_url)}
                                    alt="About Shoe Club"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ShoppingBag className="w-24 h-24 text-blue-300" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 hidden md:block">
                            <div className="text-3xl font-bold text-blue-600">5000+</div>
                            <div className="text-sm text-gray-500">Happy Customers</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Us</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                <Truck className="w-7 h-7 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Free Delivery</h3>
                            <p className="text-gray-600">
                                Free shipping on all orders above Rs. 2,500. Fast and reliable delivery across Pakistan.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                                <Shield className="w-7 h-7 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Payment</h3>
                            <p className="text-gray-600">
                                Multiple secure payment options including Cash on Delivery, bank transfer, and online payment.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                <Headphones className="w-7 h-7 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">24/7 Support</h3>
                            <p className="text-gray-600">
                                Our dedicated support team is always ready to help with any questions or concerns.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">5000+</div>
                            <div className="text-blue-200">Happy Customers</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">1000+</div>
                            <div className="text-blue-200">Products</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">50+</div>
                            <div className="text-blue-200">Brands</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">98%</div>
                            <div className="text-blue-200">Satisfaction</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 text-center">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Find Your Perfect Pair?</h2>
                    <p className="text-gray-600 mb-8">
                        Browse our collection of premium footwear and find the style that speaks to you.
                    </p>
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Shop Now
                    </Link>
                </div>
            </section>
        </div>
    );
}