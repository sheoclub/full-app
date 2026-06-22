import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

export default function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <Toaster position="top-right" />
            <Navbar />
            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <Outlet />
                </div>
            </main>
            <Footer />
        </div>
    );
}