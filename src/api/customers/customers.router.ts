import { Router } from 'express';
import { requirePermission } from '../../middlewares/auth.middleware.js';
import * as customerController from './customer.controller.js';
import * as customerSchema from './customer.schemas.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { paginationSchema } from '../../utils/pagination.util.js';

const router = Router();

router
    .route('/')
    .get(
        requirePermission('customers:read'),
        validateRequest(paginationSchema, 'query'),
        customerController.getAllCustomers
    )
    .post(
        requirePermission('customers:write'),
        validateRequest(customerSchema.createCustomer),
        customerController.createCustomer
    );

router
    .route('/:id')
    .get(requirePermission('customers:read'), customerController.getCustomer)
    .put(
        requirePermission('customers:write'),
        validateRequest(customerSchema.updateCustomer),
        customerController.updateCustomer
    )
    .delete(
        requirePermission('customers:delete'),
        customerController.deleteCustomer
    );

router
    .route('/:id/notes')
    .get(
        requirePermission('customers:read'),
        customerController.getCustomerNotes
    )
    .post(
        requirePermission('customers:write'),
        validateRequest(customerSchema.createNote),
        customerController.createNote
    );

router
    .route('/:id/notes/:noteId')
    .put(
        requirePermission('customers:write'),
        validateRequest(customerSchema.updateNote),
        customerController.updateNote
    )
    .delete(
        requirePermission('customers:write'),
        customerController.deleteNote
    );

export default router;
