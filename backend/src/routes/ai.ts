import { Router } from 'express';
import { prisma } from '../index';
import { runComplianceChecks } from '../services/complianceAgent';
import { generateGSTSummary } from '../services/gstSummary';
import { ChatGroq } from '@langchain/groq';

const router = Router();

// Get workflows history
router.get('/workflow', async (req, res) => {
  try {
    const clientId = req.query.client_id as string;
    
    // Map GSTSummaries to "Workflows" (since we don't have a native Workflow table in MVP)
    const summaries = await prisma.gSTSummary.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { client: true }
    });

    const workflows = summaries.map((s: any) => ({
      id: s.id,
      task_type: `GST Monthly (${s.period})`,
      assigned_agent: 'ComplianceAgent',
      status: 'completed',
      started_at: s.createdAt,
      completed_at: s.createdAt,
      client_id: s.clientId,
      client_name: s.client?.name,
      result: {
        outputGst: s.outputGst,
        inputGst: s.inputGst,
        netPayable: s.netPayable,
        carryForward: s.carryForward
      }
    }));

    res.json({ workflows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Kick off workflow after ingestion
router.post('/workflow', async (req, res) => {
  try {
    const clientId = req.body.clientId || req.body.client_id;
    const taskType = req.body.taskType || req.body.task_type;
    const period = req.body.period;
    
    if (!clientId || !taskType) {
      return res.status(400).json({ error: 'Missing clientId or taskType' });
    }

    let summary = {};
    if (taskType === 'gst_monthly') {
      await runComplianceChecks(clientId);
      summary = await generateGSTSummary(clientId, period || '2024-04');
    }

    res.json({
      status: 'completed',
      message: `Workflow ${taskType} executed successfully.`,
      result: summary
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Copilot Query
router.post('/copilot', async (req, res) => {
  try {
    const { query, client_id } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // GATHER CONTEXT
    let context = 'Global State:\n';
    
    if (client_id) {
      const dbClient = await prisma.client.findUnique({
        where: { id: client_id },
        include: {
          invoices: true,
          summaries: true,
          uploads: true
        }
      });
      if (dbClient) {
        context += `Client ${dbClient.name} (${dbClient.entityType})\n`;
        context += `Total Invoices: ${dbClient.invoices.length}\n`;
        const flaggedInvoices = dbClient.invoices.filter((i: any) => i.status === 'flagged');
        context += `Flagged/Non-Compliant Invoices: ${flaggedInvoices.length}\n`;
        if (dbClient.summaries.length > 0) {
          const s = dbClient.summaries[dbClient.summaries.length - 1];
          context += `Latest GST Summary (Period ${s.period}): Net Payable ₹${s.netPayable}, Output Tax ₹${s.outputGst}, eligible ITC claimed ₹${s.inputGst}\n`;
        }
      }
    } else {
      const clientsCount = await prisma.client.count();
      const returnsCount = await prisma.gSTSummary.count();
      context += `System has ${clientsCount} clients and processed ${returnsCount} GST summaries.`;
    }

    let answerStr = "AI is currently offline or GROQ_API_KEY is invalid.";
    
    try {
      const model = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY || "invalid-key",
        modelName: "llama-3.3-70b-versatile",
        temperature: 0.3,
      });

      const systemPrompt = `
        You are TaxPilot AI Copilot for Indian Chartered Accountants.
        Use ₹ for currency. Keep it professional and concise (under 4 sentences).
        Use the provided database context to answer accurately.

        DATABASE CONTEXT:
        ${context}
      `;

      const response = await model.invoke([
        ["system", systemPrompt],
        ["user", query]
      ]);
      
      answerStr = typeof response.content === 'string' ? response.content : "No answer available.";
    } catch (e: any) {
      console.error("Copilot AI Error:", e.message);
      // Fallback response for MVP
      answerStr = `[MOCK AI] I see you have ${context.length} bytes of context. Please set a valid GROQ_API_KEY to enable Chat.`;
    }

    if (client_id) {
        await prisma.copilotQuery.create({
            data: {
                clientId: client_id,
                query: query,
                response: answerStr
            }
        });
    }

    res.json({ answer: answerStr, data: { context } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
