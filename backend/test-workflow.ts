import { prisma } from './src/index';
import { generateGSTSummary } from './src/services/gstSummary';

async function runTest() {
  console.log("Starting GST Workflow Verification Test...");

  // 1. Create a mock client
  const client = await prisma.client.create({
    data: { name: 'Test Inc.', entityType: 'pvt_ltd', gstin: '29AAAAA0000A1Z5' }
  });
  console.log(`Created Client: ${client.id}`);

  // 2. Insert mock invoices (Sales and Purchases)
  await prisma.invoice.createMany({
    data: [
      {
        clientId: client.id, invoiceType: 'sales', amount: 118000, 
        cgst: 9000, sgst: 9000, igst: 0, status: 'clean', partyGstin: '27BBBBB1111B1Z5'
      },
      {
        // Purchase (with ITC eligible)
        clientId: client.id, invoiceType: 'purchase', amount: 59000, 
        cgst: 4500, sgst: 4500, igst: 0, status: 'clean', partyGstin: '07CCCCC2222C1Z5'
      },
      {
        // Purchase (flagged, not eligible for ITC)
        clientId: client.id, invoiceType: 'purchase', amount: 11800, 
        cgst: 900, sgst: 900, igst: 0, status: 'flagged', partyGstin: '03DDDDD3333D1Z5'
      }
    ]
  });
  console.log("Inserted 3 invoices (1 Sale, 2 Purchases (1 clean, 1 flagged)).");

  // 3. Run the GST Workflow (Summary generation)
  console.log("Executing generateGSTSummary()...");
  const summary = await generateGSTSummary(client.id, '2024-04');

  console.log("\n--- GST Calculation Results ---");
  console.log(`Total Sales: ₹${summary.totalSales}`);
  console.log(`Total Purchases: ₹${summary.totalPurchases}`);
  console.log(`Output GST (Liability): ₹${summary.outputGst}`);
  console.log(`Input GST (ITC Claimed): ₹${summary.inputGst}`);
  console.log(`Net Tax Payable (Output - Input): ₹${summary.netPayable}`);
  
  // Math verification
  const expectedOutput = 9000 + 9000; // 18000
  const expectedITC = 4500 + 4500; // 9000 (The flagged 1800 should be ignored)
  const expectedNet = expectedOutput - expectedITC; // 9000

  if (summary.outputGst === expectedOutput && summary.inputGst === expectedITC && summary.netPayable === expectedNet) {
    console.log("\n✅ ACCURACY VERIFIED: Tax math matches perfectly with expectations!");
  } else {
    console.log("\n❌ ACCURACY FAILED: Math is incorrect!");
    console.log(`Expected Output GST: ${expectedOutput}, Expected ITC: ${expectedITC}, Expected Net: ${expectedNet}`);
  }
}

runTest().catch(console.error).finally(() => process.exit(0));
