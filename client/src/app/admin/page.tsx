"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import { Users, Shield, ShieldOff, Trash2, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminDashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const token = Cookies.get('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                if (decoded.role === 'ADMIN') {
                    setIsAdmin(true);
                } else {
                    router.push('/dashboard');
                }
            } catch (e) {
                router.push('/dashboard');
            }
        } else {
            router.push('/login');
        }
    }, [router]);

    const { data: stats } = useQuery({
        queryKey: ['adminStats'],
        queryFn: async () => (await api.get('/admin/stats')).data,
        enabled: isAdmin,
    });

    const { data: users, isLoading } = useQuery({
        queryKey: ['users', searchTerm],
        queryFn: async () => {
            const res = await api.get('/admin/users', { params: { search: searchTerm } });
            return res.data;
        },
        enabled: isAdmin,
    });

    const handleRoleChange = async (id: number, currentRole: string) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        try {
            await api.patch(`/admin/users/${id}`, { role: newRole });
            toast.success(`Role updated to ${newRole}`);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update role');
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Are you sure? This will delete the user and ALL their files!')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            toast.success('User deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete user');
        }
    };

    if (!isMounted || !isAdmin) return <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-200"
        >
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition mb-2">
                            <ArrowLeft size={20} /> Back to My Files
                        </button>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <Shield className="text-red-500" /> Admin Control Panel
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Buttonا */}
                        <ThemeToggle />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-800 px-6 py-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4"
                        >
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400"><Users size={24} /></div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Users</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.totalUsers || 0}</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
                >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center p-12"><Loader2 className="animate-spin text-blue-500 h-8 w-8" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm">
                                <tr>
                                    <th className="p-4 font-medium">User</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Joined Date</th>
                                    <th className="p-4 font-medium text-center">Active Files</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {users?.map((user: any, index: number) => (
                                    <motion.tr
                                        key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition"
                                    >
                                        <td className="p-4">
                                            <p className="font-semibold text-slate-800 dark:text-white">{user.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                        </td>
                                        <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                    {user.role}
                                                </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-600">
                                                {user._count?.files || 0} Files
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleRoleChange(user.id, user.role)}
                                                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                                                title={user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                                            >
                                                {user.role === 'ADMIN' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
