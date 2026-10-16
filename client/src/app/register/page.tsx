'use client';
import { useState } from 'react';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

export default function RegisterPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/register', formData);
            toast.success('Account created! Check your email for OTP.');
            router.push(`/verify-email?email=${formData.email}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            {/* Button */}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700"
            >
                <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-6">Create an Account</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                        <input required type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition"
                               onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input required type="email" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition"
                               onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                        <input required type="password" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition"
                               onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium">
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
                    Already have an account? <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Login here</Link>
                </p>
            </motion.div>
        </div>
    );
}
