// @ts-nocheck
import { Request, Response } from 'express';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalFiles = await prisma.file.count();

        const files = await prisma.file.findMany();
        let storageUsed = 0;
        files.forEach(file => {
            if (fs.existsSync(file.path)) {
                storageUsed += fs.statSync(file.path).size;
            }
        });

        res.status(200).json({
            totalUsers,
            totalFiles,
            storageUsedMB: (storageUsed / (1024 * 1024)).toFixed(2) + ' MB'
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching admin stats' });
    }
};


export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        const whereClause = search ? {
            OR: [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } }
            ]
        } : {};

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isVerified: true,
                createdAt: true,
                _count: { select: { files: { where: { isDeleted: false } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (req.user.userId === parseInt(id)) {
            return res.status(400).json({ error: 'You cannot change your own role' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role },
            select: { id: true, name: true, role: true }
        });

        res.status(200).json({ message: 'User role updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: 'Error updating user role' });
    }
};
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (req.user.userId === parseInt(id)) {
            return res.status(400).json({ error: 'You cannot delete yourself' });
        }

        await prisma.verificationCode.deleteMany({ where: { userId: parseInt(id) } });
        await prisma.file.deleteMany({ where: { userId: parseInt(id) } });
        await prisma.user.delete({ where: { id: parseInt(id) } });

        res.status(200).json({ message: 'User and all related data deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user' });
    }
};
