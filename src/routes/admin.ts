import { Router } from 'express';
import { provisionTenant } from '../controllers/admin/tenant';

const router = Router();

// Endpoint to trigger tenant creation
// In a real scenario, this would be protected by a strict API key or only internal microservices
router.post('/provision-tenant', provisionTenant);

export default router;
