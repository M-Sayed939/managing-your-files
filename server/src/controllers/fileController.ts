// @ts-nocheck
import { Request, Response } from 'express';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.userId;

        const newFile = await prisma.file.create({
            data: {
                name: req.file.originalname,
                path: req.file.path,
                userId: userId,
            },
        });
        await prisma.auditLog.create({
            data: { action: 'UPLOAD', fileName: req.file.originalname, userId: req.user.userId }
        });

        res.status(201).json({
            message: 'File uploaded successfully',
            file: newFile
        });
    } catch (error) {
        console.error("Upload Error: ", error);
        res.status(500).json({ error: 'Server error during file upload' });
    }
};
export const getUserFiles = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;

        const { search, type, sortBy = 'desc', page = 1, limit = 5 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const whereClause: any = { userId, isDeleted: false };

        if (search) {
            whereClause.name = { contains: String(search), mode: 'insensitive' };
        }
        if (type && type !== 'all') {
            whereClause.name = { ...whereClause.name, endsWith: `.${type}`, mode: 'insensitive' };
        }

        const totalItems = await prisma.file.count({ where: whereClause });
        const totalPages = Math.ceil(totalItems / take);

        const files = await prisma.file.findMany({
            where: whereClause,
            orderBy: { id: String(sortBy) as any },
            skip,
            take
        });

        const formattedFiles = files.map(file => {
            let fileSize = 0;
            if (file.path && fs.existsSync(file.path)) fileSize = fs.statSync(file.path).size;
            return { id: file.id, originalName: file.name, size: fileSize, createdAt: file.createdAt || new Date() };
        });


        res.status(200).json({
            data: formattedFiles,
            pagination: { totalItems, totalPages, currentPage: Number(page) }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching files' });
    }
};export const deleteFile = async (req: Request, res: Response) => {
    try {
        const fileId = parseInt(req.params.id);
        const userId = req.user.userId;

        const file = await prisma.file.findFirst({ where: { id: fileId, userId } });
        if (!file) return res.status(404).json({ error: 'File not found' });


        await prisma.file.update({
            where: { id: fileId },
            data: { isDeleted: true }
        });

        res.status(200).json({ message: 'File moved to trash successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error during file deletion' });
    }
};
export const getUserStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'ADMIN';

        const files = await prisma.file.findMany({
            where: isAdmin ? { isDeleted: false } : { userId, isDeleted: false }
        });

        let storageUsed = 0;
        const fileTypes: Record<string, number> = {};
        const uploadHistory: Record<string, number> = {};

        files.forEach(file => {
            if (file.path && fs.existsSync(file.path)) {
                storageUsed += fs.statSync(file.path).size;
            }

            const ext = file.name.split('.').pop()?.toUpperCase() || 'OTHER';
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;

            const date = new Date(file.createdAt).toISOString().split('T')[0];
            uploadHistory[date] = (uploadHistory[date] || 0) + 1;
        });

        const typesChart = Object.keys(fileTypes).map(key => ({ name: key, value: fileTypes[key] }));
        const historyChart = Object.keys(uploadHistory).map(key => ({ date: key, count: uploadHistory[key] }));

        res.status(200).json({
            totalFiles: files.length,
            totalSize: storageUsed,
            fileTypes: typesChart,
            uploadHistory: historyChart
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching stats' });
    }
};
export const downloadFile = async (req: Request, res: Response) => {
    try {
        const fileId = parseInt(req.params.id);
        const userId = req.user.userId;

        const file = await prisma.file.findFirst({ where: { id: fileId, userId } });
        if (!file) return res.status(404).json({ error: 'File not found' });

        if (!file.path || !fs.existsSync(file.path)) {
            return res.status(404).json({ error: 'File is missing from server' });
        }


        res.download(path.resolve(file.path), file.name);
    } catch (error) {
        console.error("Download Error: ", error);
        res.status(500).json({ error: 'Server error during file download' });
    }
};
export const getAllSystemFiles = async (req: Request, res: Response) => {
    try {
        const files = await prisma.file.findMany({
            where: { isDeleted: false },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { id: 'desc' }
        });

        const formattedFiles = files.map(file => {
            let fileSize = 0;
            if (file.path && fs.existsSync(file.path)) fileSize = fs.statSync(file.path).size;
            return {
                id: file.id,
                originalName: file.name,
                size: fileSize,
                createdAt: file.createdAt || new Date(),
                user: file.user
            };
        });


        res.status(200).json({ data: formattedFiles });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching system files' });
    }
};
export const getFileDetails = async (req: Request, res: Response) => {
    try {
        const fileId = parseInt(req.params.id);
        const file = await prisma.file.findUnique({
            where: { id: fileId },
            include: { user: { select: { name: true } } }
        });

        if (!file || !file.path || !fs.existsSync(file.path)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const stats = fs.statSync(file.path);
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        let extractedContent = 'Text extraction is not supported for this file format.';
        if (['txt', 'csv', 'json'].includes(ext)) {
            const content = fs.readFileSync(file.path, 'utf-8');
            extractedContent = content.substring(0, 500) + (content.length > 500 ? '\n... (truncated)' : '');
        } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
            extractedContent = `Image File Format: ${ext.toUpperCase()}\nDimensions & EXIF metadata would be analyzed here.`;
        } else if (ext === 'zip') {
            extractedContent = `Archive File Format: ZIP\nContains compressed binary data.`;
        }

        res.status(200).json({
            metadata: {
                name: file.name,
                size: stats.size,
                type: ext.toUpperCase(),
                owner: file.user?.name || 'Unknown',
                uploadDate: file.createdAt
            },
            extractedContent
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching file details' });
    }
};
export const previewFile = async (req: Request, res: Response) => {
    try {
        const fileId = parseInt(req.params.id);
        const file = await prisma.file.findFirst({ where: { id: fileId } });

        if (!file || !file.path || !fs.existsSync(file.path)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.type(file.name);

        res.sendFile(path.resolve(file.path));
    } catch (error) {
        console.error("Preview Error:", error);
        res.status(500).json({ error: 'Server error during file preview' });
    }
};
export const getTrashedFiles = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const files = await prisma.file.findMany({
            where: { userId, isDeleted: true },
            orderBy: { id: 'desc' }
        });

        const formattedFiles = files.map(file => {
            let fileSize = 0;
            if (file.path && fs.existsSync(file.path)) fileSize = fs.statSync(file.path).size;
            return { id: file.id, originalName: file.name, size: fileSize, createdAt: file.createdAt || new Date() };
        });

        res.status(200).json({ data: formattedFiles });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching trashed files' });
    }
};

export const hardDeleteFile = async (req: Request, res: Response) => {
    try {
        const fileId = parseInt(req.params.id);
        const userId = req.user.userId;

        const file = await prisma.file.findFirst({ where: { id: fileId, userId } });
        if (!file) return res.status(404).json({ error: 'File not found' });

        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);

        await prisma.file.delete({ where: { id: fileId } });

        await prisma.auditLog.create({ data: { action: 'HARD_DELETE', fileName: file.name, userId } });

        res.status(200).json({ message: 'File permanently deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error during hard deletion' });
    }
};

