import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createContact,
  getContactList,
  updateContact,
  deleteContact,
  patchContactStatus,
} from '../controllers/contact';
import { importContacts } from '../controllers/contact/import';
import multer from 'multer';
import { createContactSchema, updateContactSchema } from '../schemas/contact/contact';
import { validate } from '../utils/validate';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

router.get('/', getContactList);
router.post('/import', upload.single('file'), importContacts);
router.post('/', validate(createContactSchema), createContact);
router.put('/:id', validate(updateContactSchema), updateContact);
router.patch('/:id/status', patchContactStatus);
router.delete('/:id', deleteContact);

export default router;
