"use client";

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Mail, Shield, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

export default function ProfilePage() {
    const router = useRouter();

    const { data: user, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => (await api.get('/auth/me')).data
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-200">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                        <ArrowLeft size={20} /> Back to Dashboard
                    </button>
                    {/* Button */}
                    <ThemeToggle />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-6 border-b border-slate-100 dark:border-slate-700 pb-8 mb-8">
                        <div className="h-24 w-24 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white dark:border-slate-800 shadow-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{user?.name}</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                <Shield size={16} className={user?.role === 'ADMIN' ? 'text-red-500' : 'text-blue-500'} />
                                {user?.role === 'ADMIN' ? 'Administrator' : 'Standard User'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 transition">
                            <Mail className="text-slate-400 dark:text-slate-500" />
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Email Address</p>
                                <p className="text-slate-800 dark:text-slate-200">{user?.email}</p>
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 transition">
                            <Calendar className="text-slate-400 dark:text-slate-500" />
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Joined Date</p>
                                <p className="text-slate-800 dark:text-slate-200">
                                    {new Date(user?.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
