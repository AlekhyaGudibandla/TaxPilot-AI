import { prisma } from '../index';
import { logAudit } from './logger';

export async function runComplianceChecks(clientId: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { clientId, status: 'clean' } // only process unflagged
    });

    if (invoices.length === 0) return { issues: 0 };

    let totalIssues = 0;
    let flaggedCount = 0;

    for (const inv of invoices) {
      const issues = [];

      // Check 1: Missing GSTIN for Purchases
      if (inv.invoiceType === 'purchase' && !inv.partyGstin) {
        issues.push({
          type: 'missing_gstin',
          severity: 'high',
          message: `Missing Vendor GSTIN for invoice ₹${inv.amount.toLocaleString()}. Input tax credit disallowed.`
        });
      }

      // Check 2: Unmatched tax components (CGST != SGST)
      if (inv.cgst > 0 && inv.sgst > 0 && Math.abs(inv.cgst - inv.sgst) !== 0) {
        issues.push({
          type: 'tax_mismatch',
          severity: 'medium',
          message: `CGST (₹${inv.cgst}) and SGST (₹${inv.sgst}) amounts do not match.`
        });
      }

      // Check 3: Suspicious combination
      if (inv.igst > 0 && (inv.cgst > 0 || inv.sgst > 0)) {
        issues.push({
          type: 'tax_mismatch',
          severity: 'high',
          message: `Both IGST (₹${inv.igst}) and CGST/SGST collected. Only one should apply.`
        });
      }

      if (issues.length > 0) {
        // Save compliance issues
        await prisma.complianceIssue.createMany({
          data: issues.map(i => ({
            invoiceId: inv.id,
            type: i.type,
            severity: i.severity,
            message: i.message
          }))
        });

        // Mark invoice as flagged
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: 'flagged' }
        });

        totalIssues += issues.length;
        flaggedCount++;
      }
    }

    if (flaggedCount > 0) {
      await logAudit('ComplianceAgent', 'Flagged Invoices', `Flagged ${flaggedCount} incoming purchase invoices for missing or strictly invalid vendor GSTINs.`, clientId);
    } else if (invoices.length > 0) {
      await logAudit('ComplianceAgent', 'Verified Invoices', `Successfully verified compliance for ${invoices.length} extracted invoices.`, clientId);
    }

    return { issues: totalIssues };
  } catch (error: any) {
    console.error(`Compliance check failed for client ${clientId}:`, error);
    throw error;
  }
}
