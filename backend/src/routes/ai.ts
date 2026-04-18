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

// Enterprise Autonomous Agent Setup: LangGraph Integration
import { compiler } from '../agents/graph';
import { HumanMessage } from '@langchain/core/messages';

// Copilot Query - LangGraph Enabled
router.post('/copilot', async (req, res) => {
  try {
    const { query, client_id } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Trigger Enterprise LangGraph with Memory Checkpointing
    const threadId = client_id || "global-copilot-thread";
    
    const config = { configurable: { thread_id: threadId } };
    const graphState = await compiler.invoke(
      { messages: [new HumanMessage(query)] },
      config
    );
    
    // Sniff the state to detect if the Graph is in Human Confirmation Mode
    const logs = (graphState.execution_log || []).join("\n- ");
    const nextNode = await compiler.getState(config);
    const isHalted = nextNode.next?.includes("commit_computation");

    const lastMsg = graphState.messages[graphState.messages.length - 1];
    let answerStr = typeof lastMsg?.content === 'string' ? lastMsg.content : "Executed workflow safely.";
    
    if (isHalted) {
       answerStr = "⚠️ **AUTHORIZATION HALT: DRAFT MODE**\n" + answerStr + "\n\n*Type 'Yes' to proceed with PostgreSQL Database Commit.*";
    }

    // Append the diagnostic trace for developer visibility
    answerStr = answerStr + "\n\n**Agent Execution Trace:**\n- " + logs;

    if (client_id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(client_id)) {
        try {
            const clientExists = await prisma.client.findUnique({ where: { id: client_id } });
            if (clientExists) {
                await prisma.copilotQuery.create({
                    data: {
                        clientId: client_id,
                        query: query,
                        response: answerStr
                    }
                });
            }
        } catch (e) {
            console.error("Failed to log query:", e);
        }
    }

    res.json({ answer: answerStr, data: { context: logs } });
  } catch (error: any) {
    console.error("Agent Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
