import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Users, Search, Loader2, AlertCircle, Eye, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import type { User } from '@/types';
import toast from 'react-hot-toast';

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params: Record<string, string> = {};
            if (search) params.search = search;
            const { data } = await api.get('/admin/users/', { params });
            setUsers(data);
        } catch {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleToggle = async (userId: number) => {
        try {
            const res = await api.post(`/admin/users/${userId}/toggle/`);
            toast.success(res.data.message || 'User status updated');
            fetchUsers();
        } catch {
            toast.error('Failed to toggle user status');
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchUsers} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">Try Again</button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-green-600" /> Users
                </h1>
                <span className="text-sm text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text" placeholder="Search by email, name or phone..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-md pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Orders</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Staff</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Active</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 text-gray-500">#{user.id}</td>
                                    <td className="py-3 px-4">
                                        <span className="font-medium text-gray-900">{user.first_name} {user.last_name}</span>
                                        <span className="text-gray-400 ml-1 text-xs">@{user.username}</span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                                    <td className="py-3 px-4 text-gray-600">{user.phone || '-'}</td>
                                    <td className="py-3 px-4 text-center font-medium">{user.order_count ?? 0}</td>
                                    <td className="py-3 px-4 text-center">
                                        {user.is_staff ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                <Shield className="w-3 h-3" /> Staff
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">User</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`inline-flex items-center justify-center w-2.5 h-2.5 rounded-full ${!user.is_suspended ? 'bg-green-500' : 'bg-red-500'}`} />
                                    </td>
                                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(user.date_joined)}</td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={`/admin/users/${user.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium">
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </Link>
                                            <button
                                                onClick={() => handleToggle(user.id)}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${!user.is_suspended
                                                    ? 'text-red-600 hover:bg-red-50'
                                                    : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                                title={!user.is_suspended ? 'Suspend User' : 'Activate User'}
                                            >
                                                {!user.is_suspended ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                                {!user.is_suspended ? 'Suspend' : 'Activate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan={9} className="py-10 text-center text-gray-400">No users found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}