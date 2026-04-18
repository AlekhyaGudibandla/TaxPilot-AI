import { prisma } from '../index';
import { logAudit } from './logger';

export async function calculateGSTLiability(clientId: string, period: string, simulate = true) {
  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new Error("Client not found");

    const rawInvoices = await prisma.invoice.findMany({
      where: { clientId }
    });

    if (rawInvoices.length === 0) {
      return {
        status: "Failed",
        issues: ["No invoices found for this client."],
        breakdown: { sales: [], purchases: [], excluded: [] }
      };
    }

    // Deduplication Engine (by invoiceNumber)
    const uniqueSales = new Map();
    const uniquePurchases = new Map();
    const excludedInvoices: any[] = [];

    for (const inv of rawInvoices) {
      // If invoice doesn't have a number, auto-generate one for mapping fallback
      const invNum = inv.invoiceNumber || `N/A-${inv.id}`;
      
      let iType = String(inv.invoiceType || 'unknown').toLowerCase();
      
      // Strict Fallback for LLM Extraction Hallucinations
      if (iType === 'unknown') {
         if (invNum.toUpperCase().startsWith('SAL')) iType = 'sales';
         else if (invNum.toUpperCase().startsWith('PUR')) iType = 'purchase';
      }

      if (iType === 'sales' || iType === 'sale') {
        if (!uniqueSales.has(invNum) || uniqueSales.get(invNum).amount < inv.amount) {
          uniqueSales.set(invNum, inv);
        }
      } else if (iType === 'purchase' || iType === 'purchases') {
        if (!uniquePurchases.has(invNum) || uniquePurchases.get(invNum).amount < inv.amount) {
          uniquePurchases.set(invNum, inv);
        }
      }
    }

    let outputGst = 0, inputGst = 0;
    let totalSales = 0, totalPurchases = 0;
    const finalSales = Array.from(uniqueSales.values());
    const finalPurchases = Array.from(uniquePurchases.values());
    const validPurchases: any[] = [];

    for (const s of finalSales) {
      totalSales += s.amount;
      outputGst += (s.cgst + s.sgst + s.igst);
    }

    for (const p of finalPurchases) {
      totalPurchases += p.amount;
      
      // Strict Compliance Filter
      const hasValidGstin = p.partyGstin && p.partyGstin.trim().length > 5 && p.partyGstin.trim() !== 'INVALIDGSTIN';
      
      if (p.status === 'clean' && hasValidGstin) {
        inputGst += (p.cgst + p.sgst + p.igst);
        validPurchases.push(p);
      } else {
        excludedInvoices.push({
          invoice: p.invoiceNumber || 'Unknown',
          reason: !hasValidGstin ? "Missing/Invalid Vendor GSTIN (ITC Disallowed)" : "Flagged by Compliance Agent"
        });
      }
    }

    let netPayable = outputGst - inputGst;
    let carryForward = 0;
    
    if (netPayable < 0) {
       carryForward = Math.abs(netPayable);
       netPayable = 0;
    }

    // Confidence Scoring
    let confidence = "high";
    let flagsCount = excludedInvoices.length;
    let totalPulled = finalPurchases.length + finalSales.length;

    if (flagsCount > 0) confidence = "medium";
    if (totalPulled > 0 && (flagsCount / totalPulled) > 0.3) confidence = "low";

    const payload = {
      status: "Success",
      outputGST: outputGst,
      inputITC: inputGst,
      netPayable: netPayable,
      carryForward: carryForward,
      confidence: confidence,
      breakdown: {
        sales: finalSales.map(s => s.invoiceNumber).slice(0, 5),
        purchases: validPurchases.map(p => p.invoiceNumber).slice(0, 5),
        excluded: excludedInvoices
      }
    };

    if (!simulate) {
      await prisma.gSTSummary.create({
        data: {
          clientId,
          period,
          totalSales,
          totalPurchases,
          outputGst,
          inputGst,
          netPayable,
          carryForward
        }
      });
      await logAudit("AI Copilot Agent", "GST Liability Committed", `Saved by AI agent. Time: ${new Date().toISOString()}. Inputs used: ${finalSales.length} sales, ${validPurchases.length} safe purchases, ${excludedInvoices.length} excluded.`, clientId);
    }

    return payload;

  } catch (error: any) {
    console.error(`Calculator failed for client ${clientId}:`, error);
    return { status: "Failed", issues: [error.message], breakdown: { sales: [], purchases: [], excluded: [] } };
  }
}
