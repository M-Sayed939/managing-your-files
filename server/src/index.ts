import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import fileRoutes from './routes/fileRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
