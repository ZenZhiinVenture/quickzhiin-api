import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createContact,
  getContactDetail,
  getContactList,
  updateContact,
  deleteContact,
  patchContactStatus,
} from '../controllers/contact';
import { createContactSchema, updateContactSchema } from '../schemas/contact/contact';
import { validate } from '../utils/validate';

const router = Router();

router.use(authenticateToken);

router.get('/', getContactList);

router.patch('/:id/status', patchContactStatus);
router.get('/:id', getContactDetail);

router.post('/', validate(createContactSchema), createContact);

router.put('/:id', validate(updateContactSchema), updateContact);

router.delete('/:id', deleteContact);

export default router;
