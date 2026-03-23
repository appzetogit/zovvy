import express from 'express';
import { createContactSubmission, getContactSubmissions, updateContactSubmissionStatus } from '../controllers/contactSubmissionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createContactSubmission);
router.get('/', protect, admin, getContactSubmissions);
router.patch('/:id/status', protect, admin, updateContactSubmissionStatus);

export default router;
