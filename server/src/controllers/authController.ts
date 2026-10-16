// @ts-nocheck
import { Request, Response } from 'express';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!\%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character (@$!%*?&)"
            });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields (name, email, password) are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({ data: { name, email, password: hashedPassword } });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await prisma.verificationCode.create({
            data: {
                code: otp,
                userId: newUser.id,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // صلحنا السطر ده (15 دقيقة)
            }
        });

        // 1. هنطبع الكود في الكونسول عشان لو الإيميل اتأخر تاخده منه وتكمل
        console.log(`\n OTP CODE FOR ${email} IS: ${otp} \n`);

        // 2. هنبعت الإيميل في الخلفية بدون await عشان السيرفر ميعلقش
        sendEmail(email, 'Verify Your Email', `Your verification code is: ${otp}`)
            .catch(err => console.log("Background email error:", err.message));

        // 3. نرد فوراً على الفرونت إند
        return res.status(201).json({ message: 'User registered. Please check your email for the OTP.' });

    } catch (error) {
        console.error("Registration Error: ", error);
        res.status(500).json({ error: 'Registration error' });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const verificationRecord = await prisma.verificationCode.findFirst({
            where: { userId: user.id, code: String(code) }
        });

        if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
        await prisma.verificationCode.deleteMany({ where: { userId: user.id } });

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Verification error' });
    }
};

export const resendCode = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'Email already verified' });

        await prisma.verificationCode.deleteMany({ where: { userId: user.id } });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma.verificationCode.create({
            data: {
                code: otp,
                userId: user.id,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            }
        });

        console.log(`\n NEW OTP CODE FOR ${email} IS: ${otp} \n`);

        sendEmail(email, 'Your New Verification Code', `Your new code is: ${otp}`)
            .catch(err => console.log("Background email error:", err.message));

        return res.status(200).json({ message: 'Code resent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error resending code' });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching profile' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login' });
    }
};
