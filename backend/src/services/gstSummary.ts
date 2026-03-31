import { prisma } from '../index';

export async function generateGSTSummary(clientId: string, period: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { clientId }
    });

    if (invoices.length === 0) return { status: 'No invoices found' };

    let totalSales = 0, totalPurchases = 0;
    let outputGst = 0, inputGst = 0;

    for (const inv of invoices) {
      if (inv.invoiceType === 'sales') {
        totalSales += inv.amount;
        outputGst += (inv.cgst + inv.sgst + inv.igst);
      } else if (inv.invoiceType === 'purchase') {
        totalPurchases += inv.amount;
        // Only claim ITC if the invoice is clean and has vendor GSTIN
        if (inv.status === 'clean' && inv.partyGstin) {
          inputGst += (inv.cgst + inv.sgst + inv.igst);
        }
      }
    }

    let netPayable = outputGst - inputGst;
    let carryForward = 0;
    
    if (netPayable < 0) {
       carryForward = Math.abs(netPayable);
       netPayable = 0;
    }

    const summary = await prisma.gSTSummary.create({
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

    return summary;
  } catch (error: any) {
    console.error(`GST Summary generation failed for client ${clientId}:`, error);
    throw error;
  }
}
