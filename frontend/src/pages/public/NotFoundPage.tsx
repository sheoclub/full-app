import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
            <Helmet>
                <title>Page Not Found | Shoe Club Pakistan</title>
                <meta name="description" content="The requested Shoe Club Pakistan page was not found." />
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <div className="max-w-xl text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                <p className="text-sm font-semibold text-blue-600 mb-2">404</p>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
                <p className="text-gray-600 mb-6">
                    This Shoe Club Pakistan page does not exist. Visit the shop page to browse ladies shoes, heels, sandals, pumps, flats, and new arrivals.
                </p>
                <Link
                    to="/shop"
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                    Go to Shop
                </Link>
            </div>
        </div>
    );
}
