import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.post('/profile/avatar', authenticate, upload.single('avatar'), userController.uploadAvatar);
router.get('/achievements', authenticate, userController.getAchievements);
router.get('/study-progress', authenticate, userController.getStudyProgress);

export default router;