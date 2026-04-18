import { prisma } from '../index';
import { ChatGroq } from '@langchain/groq';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import { z } from 'zod';
import { logAudit } from './logger';

const InvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  partyName: z.string().optional(),
  sellerGstin: z.string().optional(),
  buyerGstin: z.string().optional(),
  amount: z.number().default(0),
  cgst: z.number().default(0),
  sgst: z.number().default(0),
  igst: z.number().default(0),
  invoiceType: z.enum(['sales', 'purchase', 'unknown']).default('unknown'),
});

const ResultSchema = z.object({
  invoices: z.array(InvoiceSchema).optional(),
});

export async function processDocumentAsync(fileId: string, filePath: string, clientId: string) {
  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new Error("Client not found for document extraction.");

    let rawText = '';
    if (filePath.toLowerCase().endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      rawText = data.text;
    } else {
      rawText = fs.readFileSync(filePath, 'utf-8');
    }

    if (!rawText || rawText.trim().length === 0) throw new Error("No readable text found in document.");

    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      modelName: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const prompt = `
    You are an AI trained to extract financial data from Indian context invoices/documents.
    Extract the list of invoices present in this document.

    CLIENT CONTEXT:
    Client Name: ${client.name}
    Client GSTIN: ${client.gstin || "Unknown"}

    Rule: Detect the 'sellerGstin' (the issuer) and 'buyerGstin' (billed to). 
    If the Client is selling, invoiceType="sales". If Client is buying, invoiceType="purchase". If uncertain, invoiceType="unknown".

    CRITICAL INSTRUCTION: You MUST format your response as a valid JSON object starting with { and ending with }. DO NOT output ANY conversational text before or after the JSON.
    
    If no invoices are found, output {"invoices": []}

    Format exactly like this example:
    {"invoices": [{"invoiceNumber": "INV123", "invoiceDate": "2024-03-31", "partyName": "ABC Corp", "sellerGstin": "29XXXXXX", "buyerGstin": "29YYYYYY", "amount": 1180, "cgst": 90, "sgst": 90, "igst": 0, "invoiceType": "sales"}]}

    Document Text:
    ${rawText.substring(0, 10000)}
    `;

    const response = await model.invoke(prompt);
    
    let parsedData: any = { invoices: [] };
    try {
        let cleanJsonStr = typeof response.content === 'string' ? response.content.trim() : "";
        const firstBrace = cleanJsonStr.indexOf('{');
        const lastBrace = cleanJsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
             cleanJsonStr = cleanJsonStr.substring(firstBrace, lastBrace + 1);
        }
        parsedData = JSON.parse(cleanJsonStr);
    } catch (e) {
        console.warn("Failed to parse JSON from Groq. Applying fallback Regex extractor.");
        const fallbackInvoices = [];
        const textContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        const lines = textContent.split('\n');
        let currentInvoice: any = null;
        for (const line of lines) {
           if (line.includes('Invoice No:')) {
               if (currentInvoice && currentInvoice.amount > 0) fallbackInvoices.push(currentInvoice);
               currentInvoice = { invoiceNumber: line.split(':')[1].trim(), amount: 0, cgst: 0, sgst: 0, igst: 0, invoiceType: 'purchase' };
           }
           if (currentInvoice) {
               if (line.includes('Total Amount:') || line.includes('Total:')) currentInvoice.amount = parseFloat(line.split(':')[1].replace(/[^0-9.]/g, '')) || 0;
               if (line.includes('CGST:')) currentInvoice.cgst = parseFloat(line.split(':')[1].replace(/[^0-9.]/g, '')) || 0;
               if (line.includes('SGST:')) currentInvoice.sgst = parseFloat(line.split(':')[1].replace(/[^0-9.]/g, '')) || 0;
               if (line.includes('IGST:')) currentInvoice.igst = parseFloat(line.split(':')[1].replace(/[^0-9.]/g, '')) || 0;
               if (line.includes('Party GSTIN:') || line.includes('GSTIN:')) currentInvoice.sellerGstin = line.split(':')[1].replace(/[^A-Za-z0-9]/g, '').trim();
           }
        }
        if (currentInvoice && currentInvoice.amount > 0) fallbackInvoices.push(currentInvoice);
        if (fallbackInvoices.length > 0) parsedData = { invoices: fallbackInvoices };
        else throw new Error("LLM Output formatting completely failed and Regex fallback extracted 0 invoices.");
    }

    const validated = ResultSchema.safeParse(parsedData);
    if (!validated.success) throw new Error(`Validation failed: ${JSON.stringify(validated.error.errors)}`);

    const invoices = validated.data.invoices || [];

    for (const inv of invoices) {
      let finalType = 'unknown';
      let derivedPartyGstin = '';

      // Rule-based classification (Primary)
      if (client.gstin) {
          if (inv.sellerGstin === client.gstin) {
              finalType = 'sales';
              derivedPartyGstin = inv.buyerGstin || inv.partyName || '';
          } else if (inv.buyerGstin === client.gstin) {
              finalType = 'purchase';
              derivedPartyGstin = inv.sellerGstin || inv.partyName || '';
          }
      }
      
      // AI Fallback
      if (finalType === 'unknown' && inv.invoiceType && inv.invoiceType !== 'unknown') {
          finalType = inv.invoiceType;
          derivedPartyGstin = finalType === 'sales' ? (inv.buyerGstin || '') : (inv.sellerGstin || '');
      }

      await prisma.invoice.create({
        data: {
          clientId,
          fileId,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate) : null,
          partyName: inv.partyName || 'Unknown Vendor',
          partyGstin: derivedPartyGstin,
          amount: inv.amount,
          cgst: inv.cgst,
          sgst: inv.sgst,
          igst: inv.igst,
          invoiceType: finalType,
          status: 'clean'
        }
      });
    }

    await prisma.fileUpload.update({ where: { id: fileId }, data: { status: 'extracted' } });
    await logAudit('DocumentProcessor', 'Extraction Complete', `Successfully extracted ${invoices.length} invoices.`, clientId);

    // Auto-Trigger Compliance
    try {
        const { runComplianceChecks } = await import('./complianceAgent');
        await runComplianceChecks(clientId);
    } catch (complianceErr) {
        console.error("Auto-compliance failed:", complianceErr);
    }

    console.log(`Document ${fileId} parsed successfully. Found ${parsedData.invoices.length} invoices.`);
  } catch (error: any) {
    console.error(`Error processing document ${fileId}:`, error);
    await logAudit('DocumentProcessor', 'Extraction Failed', `Error parsing document: ${error.message}`, clientId);
    await prisma.fileUpload.update({
      where: { id: fileId },
      data: { status: 'failed' }
    });
  }
}
