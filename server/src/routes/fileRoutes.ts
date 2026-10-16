import express from 'express';
import multer from 'multer';
import {
    uploadFile,
    getUserFiles,
    deleteFile,
    getUserStats,
    downloadFile,
    getAllSystemFiles,
    previewFile, getTrashedFiles, hardDeleteFile, getFileDetails
} from '../controllers/fileController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });


router.get('/preview/:id', previewFile);
router.use(authenticate);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getUserFiles);
router.delete('/:id', deleteFile);
router.get('/stats', getUserStats);
router.get('/download/:id', downloadFile);
router.get('/all-system-files', authenticate, isAdmin, getAllSystemFiles);
router.get('/preview/:id', previewFile);
router.get('/trash', getTrashedFiles);
router.delete('/trash/:id', hardDeleteFile);
router.get('/:id/details', getFileDetails);
export default router;
