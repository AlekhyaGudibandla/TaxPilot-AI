import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Helper to map Prisma camelCase to frontend snake_case
const mapClient = (c: any) => ({
  ...c,
  entity_type: c.entityType,
  created_at: c.createdAt,
});

// Create Client
router.post('/', async (req, res) => {
  try {
    const { name, entity_type, pan, gstin } = req.body;
    const client = await prisma.client.create({
      data: {
        name,
        entityType: entity_type || 'pvt_ltd',
        pan,
        gstin
      }
    });
    res.status(201).json(mapClient(client));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List Clients
router.get('/', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Return wrapped in 'clients' to match frontend response shape: { clients: [...] }
    res.json({ clients: clients.map(mapClient) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Client
router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        invoices: true,
        summaries: true,
        uploads: true
      }
    });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(mapClient(client));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Client
router.delete('/:id', async (req, res) => {
  try {
    await prisma.client.delete({
      where: { id: req.params.id }
    });
    res.json({ status: 'deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
