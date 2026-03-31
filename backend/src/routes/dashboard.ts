import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const clientsCount = await prisma.client.count();
    const gstReturnsCount = await prisma.gSTSummary.count();
    const pendingUploads = await prisma.fileUpload.count({
      where: { status: 'pending' }
    });

    // Recent activities (MVP mock or real)
    const recentReturns = await prisma.gSTSummary.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { client: true }
    });

    res.json({
      stats: {
        clients: clientsCount,
        gst_returns: gstReturnsCount,
        itr_returns: 0,
        pending_tasks: pendingUploads,
      },
      recent_returns: recentReturns.map((r: any) => ({
        id: r.id,
        return_type: 'GST Monthly',
        period: r.period,
        net_payable: r.netPayable,
        status: 'prepared',
        confidence_score: 95
      })),
      recent_workflows: [] // MVP placeholder
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
