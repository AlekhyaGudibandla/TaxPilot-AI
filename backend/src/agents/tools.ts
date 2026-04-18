import { z } from 'zod';
import { prisma } from '../index';
import { DynamicStructuredTool } from "@langchain/core/tools";

export const fetch_clients_tool = new DynamicStructuredTool({
  name: "fetch_clients",
  description: "Fetches a database snapshot array of all clients currently registered in the system. Use this first to find the exact UUID of a client.",
  schema: z.object({
     dummy: z.string().optional().describe("Leave empty")
  }),
  func: async () => {
    const clients = await prisma.client.findMany({
      include: {
        summaries: true
      }
    });
    return JSON.stringify(clients);
  }
});

import { calculateGSTLiability } from '../services/gstCalculator';

export const compute_gst_return_tool = new DynamicStructuredTool({
  name: "compute_gst_return_tool",
  description: "DETERMINISTIC CALCULATOR: Calculates exact Output GST and Input ITC for a given client via native TypeScript mathematical algorithms. It applies rigid compliance filters and drops problematic invoices (returns exclusions). Always returns JSON payload. Do NOT attempt to do math yourself.",
  schema: z.object({
    clientId: z.string().describe("Exact 36-char Client UUID (Fetch using fetch_clients first!)"),
    period: z.string().describe("Tax Period e.g. '2024-04'").optional().default("2024-04")
  }),
  func: async ({ clientId, period }) => {
     const computation = await calculateGSTLiability(clientId, period, true);
     return JSON.stringify(computation);
  }
});

export const commit_gst_return_tool = new DynamicStructuredTool({
  name: "commit_gst_return_tool",
  description: "DANGEROUS ACTION: This physically executes a permanent SQL database write. Call this ONLY AFTER you have explicitly asked the user for confirmation and they replied 'Yes' or 'Go ahead'.",
  schema: z.object({
    clientId: z.string().describe("Exact 36-char Client UUID"),
    period: z.string().describe("Tax Period e.g. '2024-04'").optional().default("2024-04")
  }),
  func: async ({ clientId, period }) => {
     // Execute in DB Commit Mode (simulate = false)
     try {
         await calculateGSTLiability(clientId, period, false);
         return "SUCCESS: Formal PostgreSQL commit successful.";
     } catch (e: any) {
         return `FAILURE: Could not commit ledger. Reason: ${e.message}`;
     }
  }
});

export const agentTools = [fetch_clients_tool, compute_gst_return_tool, commit_gst_return_tool];
