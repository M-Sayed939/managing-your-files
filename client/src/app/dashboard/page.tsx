'use client';
import {useState, useCallback, useEffect} from 'react';
import {useDropzone} from 'react-dropzone';
import {api} from '@/lib/axios';
import toast from 'react-hot-toast';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
    File,
    UploadCloud,
    Trash,
    Trash2,
    LogOut,
    Loader2,
    Download,
    Eye,
    User,
    Info,
    X,
    Shield,
    Moon,
    Sun
} from 'lucide-react';
import {PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer} from 'recharts';
import {Search, Filter, SortDesc} from 'lucide-react';
import {useRouter} from 'next/navigation';
import Cookies from 'js-cookie';
import {jwtDecode} from "jwt-decode";
import {motion, AnimatePresence} from 'framer-motion';
import {useTheme} from 'next-themes';

const containerVariants = {
    hidden: {opacity: 0},
    show: {opacity: 1, transition: {staggerChildren: 0.1}}
};
const itemVariants = {
    hidden: {opacity: 0, y: 20},
    show: {opacity: 1, y: 0}
};

export default function DashboardPage() {
    const router = useRouter();
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const {theme, setTheme} = useTheme();

    useEffect(() => {
        setIsMounted(true);
        const token = Cookies.get('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setIsAdmin(decoded.role === 'ADMIN');
            } catch (error) {
                console.error("Invalid token");
            }
        }
    }, []);

    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showTrash, setShowTrash] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('desc');
    const [page, setPage] = useState(1);
    const [selectedFileForDetails, setSelectedFileForDetails] = useState<number | null>(null);
    const [fileDetails, setFileDetails] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const openFileDetails = async (id: number) => {
        setSelectedFileForDetails(id);
        setDetailsLoading(true);
        try {
            const res = await api.get(`/files/${id}/details`);
            setFileDetails(res.data);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to fetch file details');
        } finally {
            setDetailsLoading(false);
        }
    };

    const {data: statsData} = useQuery({
        queryKey: ['stats'],
        queryFn: async () => (await api.get('/files/stats')).data
    });

    const {data: userProfile} = useQuery({
        queryKey: ['profile'],
        queryFn: async () => (await api.get('/auth/me')).data
    });

    const {data: filesData, isLoading} = useQuery({
        queryKey: ['files', showTrash, isAdmin, searchTerm, filterType, sortBy, page],
        queryFn: async () => {
            let endpoint = showTrash ? '/files/trash' : (isAdmin ? '/files/all-system-files' : '/files');
            try {
                const res = await api.get(endpoint, {
                    params: {
                        search: searchTerm,
                        type: filterType,
                        sortBy,
                        page,
                        limit: 5
                    }
                });
                return res.data;
            } catch (error: any) {
                return {data: []};
            }
        }
    });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true);
        setUploadProgress(0);
        const uploadPromises = acceptedFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            try {
                await api.post('/files/upload', formData, {
                    headers: {'Content-Type': 'multipart/form-data'},
                    onUploadProgress: (e) => {
                        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
                    }
                });
            } catch (error) {
                toast.error(`Failed to upload ${file.name}`);
            }
        });

        await Promise.all(uploadPromises);
        toast.success('Files uploaded successfully!');
        queryClient.invalidateQueries({queryKey: ['files']});
        queryClient.invalidateQueries({queryKey: ['stats']});
        setUploading(false);
    }, [queryClient]);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

    const handleLogout = () => {
        Cookies.remove('token');
        router.push('/login');
    };

    const handleDelete = async (id: number) => {
        try {
            if (showTrash) {
                await api.delete(`/files/trash/${id}`);
                toast.success('File permanently deleted');
            } else {
                await api.delete(`/files/${id}`);
                toast.success('File moved to trash');
            }
            queryClient.invalidateQueries({queryKey: ['files']});
            queryClient.invalidateQueries({queryKey: ['stats']});
        } catch (error) {
            toast.error('Failed to delete file');
        }
    };

    const handleDownload = async (id: number, filename: string) => {
        try {
            const response = await api.get(`/files/download/${id}`, {responseType: 'blob'});
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast.error('Failed to download file');
        }
    };

    const filesList = filesData ? (Array.isArray(filesData) ? filesData : (filesData.data || filesData.files || [])) : [];

    return (
        <motion.div
            initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.4}}
            className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-200"
        >
            {/* Header */}
            <div
                className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                        Hello, {userProfile?.name || 'User'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {!isMounted ? 'Loading...' : (isAdmin ? 'Manage all system files and storage.' : 'Manage your files and storage easily.')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Dark Mode Toggle */}
                    {isMounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-yellow-400 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition shadow-sm"
                        >
                            {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                        </button>
                    )}
                    {isMounted && isAdmin && (
                        <button onClick={() => router.push('/admin')}
                                className="flex items-center gap-2 bg-slate-800 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 dark:hover:bg-blue-700 transition shadow-sm font-medium">
                            <Shield size={18}/> Admin Panel
                        </button>
                    )}
                    <button onClick={() => router.push('/profile')}
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm font-medium">
                        <User size={18}/> Profile
                    </button>
                    <button onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition font-medium">
                        <LogOut size={18}/> Logout
                    </button>
                </div>
            </div>

            {/* Stats & Charts */}
            <div className="max-w-5xl mx-auto mb-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <motion.div whileHover={{y: -5}}
                                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Files</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{statsData?.totalFiles || 0}</p>
                    </motion.div>
                    <motion.div whileHover={{y: -5}}
                                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Storage Usage</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {statsData?.totalSize ? (statsData.totalSize / (1024 * 1024)).toFixed(2) : 0} MB
                        </p>
                    </motion.div>
                </div>

                {statsData?.totalFiles > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Upload
                                History</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statsData?.uploadHistory || []}>
                                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false}
                                               stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}/>
                                        <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false}
                                               stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}/>
                                        <Tooltip cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9'}}
                                                 contentStyle={{
                                                     backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                                                     borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                                                     color: theme === 'dark' ? '#fff' : '#000'
                                                 }}/>
                                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div
                            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">File
                                Types</h3>
                            <div className="h-48 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={statsData?.fileTypes || []} innerRadius={60} outerRadius={80}
                                             paddingAngle={5} dataKey="value">
                                            {statsData?.fileTypes?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                                            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                                            color: theme === 'dark' ? '#fff' : '#000'
                                        }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Dropzone */}
            <div className="max-w-5xl mx-auto mb-8">
                <div {...getRootProps()}
                     className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500'}`}>
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4"/>
                    {uploading ? (
                        <div className="w-full max-w-xs mx-auto">
                            <p className="text-lg text-slate-600 dark:text-slate-300 font-medium mb-2">Uploading... {uploadProgress}%</p>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                     style={{width: `${uploadProgress}%`}}></div>
                            </div>
                        </div>
                    ) : isDragActive ? (
                        <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">Drop files here!</p>
                    ) : (
                        <p className="text-lg text-slate-600 dark:text-slate-400">Drag & drop files here, or click to
                            browse</p>
                    )}
                </div>
            </div>

            {/* Files List */}
            <div
                className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div
                    className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                        {showTrash ? 'Trash Bin' : 'Uploaded Files'}
                    </h2>
                    <button onClick={() => setShowTrash(!showTrash)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${showTrash ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                        {showTrash ? <File size={18}/> : <Trash size={18}/>}
                        {showTrash ? 'Back to Files' : 'View Trash'}
                    </button>
                </div>

                {!showTrash && (
                    <div
                        className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                            <input type="text" placeholder="Search files by name..."
                                   className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition"
                                   value={searchTerm} onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}/>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-32">
                                <Filter className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                                <select
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 appearance-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                                    value={filterType} onChange={(e) => {
                                    setFilterType(e.target.value);
                                    setPage(1);
                                }}>
                                    <option value="all">All Types</option>
                                    {statsData?.fileTypes?.map((type: any) => (<option key={type.name}
                                                                                       value={type.name.toLowerCase()}>{type.name} File</option>))}
                                </select>
                            </div>
                            <div className="relative flex-1 md:w-36">
                                <SortDesc className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                                <select
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 appearance-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                                    value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="desc">Newest First</option>
                                    <option value="asc">Oldest First</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {filesData?.pagination && filesData.pagination.totalPages > 1 && (
                    <div
                        className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-300">Previous
                        </button>
                        <span
                            className="text-sm font-medium text-slate-600 dark:text-slate-400">Page {filesData.pagination.currentPage} of {filesData.pagination.totalPages}</span>
                        <button disabled={page === filesData.pagination.totalPages} onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-300">Next
                        </button>
                    </div>
                )}

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400"><Loader2
                            className="animate-spin h-8 w-8 text-blue-500 mb-4"/><p>Loading your files...</p></div>
                    ) : filesList.length === 0 ? (
                        <p className="p-6 text-center text-slate-500 dark:text-slate-400">{showTrash ? 'No files in trash.' : 'No files uploaded yet.'}</p>
                    ) : (
                        <motion.div variants={containerVariants} initial="hidden" animate="show">
                            {filesList.map((file: any) => (
                                <motion.div variants={itemVariants} key={file.id}
                                            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                                            <File size={24}/>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-white">
                                                {file.originalName}
                                                {isAdmin && file.user && <span
                                                    className="text-xs text-blue-500 dark:text-blue-300 ml-2 bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded">By: {file.user.name}</span>}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(2)} KB
                                                • {new Date(file.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!showTrash && (
                                            <>
                                                <button
                                                    onClick={() => window.open(`http://localhost:8080/api/files/preview/${file.id}`, '_blank')}
                                                    className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition"
                                                    title="Preview"><Eye size={20}/></button>
                                                <button onClick={() => openFileDetails(file.id)}
                                                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                                        title="File Details"><Info size={20}/></button>
                                                <button onClick={() => handleDownload(file.id, file.originalName)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition"
                                                        title="Download"><Download size={20}/></button>
                                            </>
                                        )}
                                        <button onClick={() => handleDelete(file.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                                                title="Delete"><Trash2 size={20}/></button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedFileForDetails && (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{scale: 0.9, opacity: 0, y: 20}} animate={{scale: 1, opacity: 1, y: 0}}
                                    exit={{scale: 0.9, opacity: 0, y: 20}} transition={{type: "spring", duration: 0.5}}
                                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-slate-700">
                            <button onClick={() => {
                                setSelectedFileForDetails(null);
                                setFileDetails(null);
                            }}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={24}/></button>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Info/> File Details</h2>
                            {detailsLoading ? (
                                <div className="flex justify-center p-8"><Loader2
                                    className="animate-spin text-blue-600 h-8 w-8"/></div>
                            ) : fileDetails ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">File
                                                Name</p>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate"
                                               title={fileDetails.metadata.name}>{fileDetails.metadata.name}</p>
                                        </div>
                                        <div
                                            className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Type
                                                & Size</p>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fileDetails.metadata.type} • {(fileDetails.metadata.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 font-bold mb-2 mt-4">Extracted
                                            Content / Summary:</p>
                                        <div
                                            className="bg-slate-900 dark:bg-black text-green-400 p-4 rounded-lg text-sm font-mono overflow-y-auto max-h-48 whitespace-pre-wrap border border-slate-700">
                                            {fileDetails.extractedContent}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-red-500">Could not load details.</p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
