const fs = require('fs');

const API_BASE = 'http://localhost:8000/api';

async function run() {
  console.log("1. Creating Test Client...");
  const clientRes = await fetch(`${API_BASE}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'E2E Test Client', entity_type: 'pvt_ltd', pan: 'ABCDE1234F', gstin: '29ABCDE1234F1Z5' })
  });
  const client = await clientRes.json();
  console.log(`✅ Client Created: ID ${client.id}\n`);

  console.log("2. Uploading dummy_invoice.csv...");
  const formData = new FormData();
  
  // Create File-like object (Node 20 native FormData)
  const fileContent = fs.readFileSync('../dummy_invoice.csv');
  const fileBlob = new Blob([fileContent], { type: 'text/csv' });
  formData.append('files', fileBlob, 'dummy_invoice.csv');

  const uploadRes = await fetch(`${API_BASE}/upload?client_id=${client.id}`, {
    method: 'POST',
    body: formData
  });
  const uploadData = await uploadRes.json();
  console.log("✅ Upload API Response:");
  console.log(uploadData);
  console.log("\n⏳ Waiting 5 seconds for background Async Groq AI Document Parsing...");
  await new Promise(r => setTimeout(r, 5000));

  console.log("3. Running GST Pipeline Workflow...");
  const workflowRes = await fetch(`${API_BASE}/ai/workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: client.id, task_type: 'gst_monthly', period: '2024-04' })
  });
  const workflowData = await workflowRes.json();
  console.log("✅ Pipeline Execution Check:");
  console.log(JSON.stringify(workflowData, null, 2));
  console.log("");

  console.log("4. Fetching Workflows History...");
  const historyRes = await fetch(`${API_BASE}/ai/workflow?client_id=${client.id}`);
  const historyData = await historyRes.json();
  console.log("✅ Workflow History Table API:");
  console.log(`Found ${historyData.workflows ? historyData.workflows.length : 0} workflows for client.`);
  console.log(JSON.stringify(historyData, null, 2));
  console.log("");

  console.log("5. Testing Tax Calculator Endpoint...");
  const taxRes = await fetch(`${API_BASE}/tax-calculator?income=1200000&regime=new`);
  const taxData = await taxRes.json();
  console.log("✅ Tax Calculator API Response:");
  console.log(taxData);
  console.log("\n🎉 E2E Test Completed Successfully!");
}

run().catch(console.error);
