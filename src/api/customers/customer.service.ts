import logger from '../../utils/logger.util.js';
import prisma from '../../config/prisma.config.js';
import { z } from 'zod';
import * as customerSchema from './customer.schemas.js';
import type { Customer, Note } from '../../generated/prisma/client.js';

export async function getAllCustomers(
    organizationId: string,
    take: number,
    skip: number
): Promise<{
    customers: Customer[];
    total: number;
}> {
    try {
        const customers = await prisma.customer.findMany({
            where: {
                organizationId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take,
            skip
        });

        return { customers, total: customers.length };
    } catch (error) {
        logger.error(`Error fetching customers: ${error}`);
        throw error;
    }
}

export async function createCustomer(
    data: z.infer<typeof customerSchema.createCustomer>,
    activeOrganizationId: string
) {
    try {
        const customer = await prisma.customer.create({
            data: {
                ...data,
                organizationId: activeOrganizationId,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        return customer;
    } catch (error) {
        logger.error(`Error creating customer: ${error}`);
        throw error;
    }
}

export async function getCustomerDetails(id: string, organizationId: string) {
    try {
        const customer = await prisma.customer.findUnique({
            where: {
                id,
                organizationId
            },
            include: {
                tags: true,
                notes: true,
                orders: true,
                supportTickets: true,
                customerEvents: true
            }
        });

        return customer;
    } catch (error) {
        logger.error(`Error fetching customer: ${error}`);
        throw error;
    }
}

export async function updateCustomer(
    id: string,
    data: z.infer<typeof customerSchema.updateCustomer>,
    organizationId: string
) {
    try {
        const customer = await prisma.customer.update({
            where: {
                id,
                organizationId
            },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });

        return customer;
    } catch (error) {
        logger.error(`Error updating customer: ${error}`);
        throw error;
    }
}

export async function deleteCustomer(id: string, organizationId: string) {
    try {
        const customer = await prisma.customer.delete({
            where: {
                id,
                organizationId
            }
        });

        return customer;
    } catch (error) {
        logger.error(`Error deleting customer: ${error}`);
        throw error;
    }
}

export async function getCustomerNotes(customerId: string): Promise<Note[]> {
    try {
        const notes = await prisma.note.findMany({
            where: {
                customerId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return notes;
    } catch (error) {
        logger.error(`Error fetching customer notes: ${error}`);
        throw error;
    }
}

export async function createNote(
    customerId: string,
    data: z.infer<typeof customerSchema.createNote>,
    userId: string
): Promise<Note> {
    try {
        const note = await prisma.note.create({
            data: {
                ...data,
                customerId,
                authorId: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        return note;
    } catch (error) {
        logger.error(`Error creating note: ${error}`);
        throw error;
    }
}

export async function updateNote(
    id: string,
    noteId: string,
    data: z.infer<typeof customerSchema.updateNote>,
    userId: string
): Promise<Note> {
    try {
        const note = await prisma.note.findUnique({
            where: {
                id: noteId,
                customerId: id,
                authorId: userId
            }
        });

        if (!note) {
            throw new Error('Note not found');
        }

        if (note.authorId !== userId) {
            throw new Error('You are not authorized to update this note');
        }

        const updatedNote = await prisma.note.update({
            where: {
                id: noteId,
                customerId: id,
                authorId: userId
            },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });

        return updatedNote;
    } catch (error) {
        logger.error(`Error updating note: ${error}`);
        throw error;
    }
}

export async function deleteNote(
    customerId: string,
    noteId: string,
    userId: string
): Promise<Note> {
    try {
        const note = await prisma.note.findUnique({
            where: {
                id: noteId,
                customerId,
                authorId: userId
            }
        });

        if (!note) {
            throw new Error('Note not found');
        }

        if (note.authorId !== userId) {
            throw new Error('You are not authorized to delete this note');
        }

        await prisma.note.delete({
            where: {
                id: noteId,
                customerId,
                authorId: userId
            }
        });

        return note;
    } catch (error) {
        logger.error(`Error deleting note: ${error}`);
        throw error;
    }
}
