'use client';
import { useState, Suspense } from 'react';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

function VerifyForm() {
    const searchParams = useSearchParams();
    const initialEmail = searchParams.get('email') || '';
    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/verify-email', { email, code });
            toast.success('Email verified successfully! You can now login.');
            router.push('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            toast.error("Please enter your email first");
            return;
        }
        setIsResending(true);
        try {
            const res = await api.post('/auth/resend-code', { email });
            toast.success(res.data.message || 'OTP resent successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                       className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">OTP Code</label>
                <input required type="text" maxLength={6} value={code} onChange={e => setCode(e.target.value)}
                       className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none tracking-widest text-center text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition" placeholder="123456" />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium">
                {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline disabled:text-slate-400 dark:disabled:text-slate-500 disabled:no-underline transition"
            >
                {isResending ? 'Sending...' : "Didn't receive the code? Resend OTP"}
            </button>
        </form>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            {/* Button*/}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700"
            >
                <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-6">Verify Email</h1>
                <Suspense fallback={<div className="text-center dark:text-slate-300">Loading...</div>}>
                    <VerifyForm />
                </Suspense>
            </motion.div>
        </div>
    );
}
