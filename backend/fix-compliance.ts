import { prisma } from './src/index';
import { runComplianceChecks } from './src/services/complianceAgent';

async function run() {
  const clients = await prisma.client.findMany();
  for (const client of clients) {
    try {
      await runComplianceChecks(client.id);
      console.log('Ran compliance loop for client', client.name);
    } catch (e) {
      console.error(e);
    }
  }
}

run().then(() => process.exit(0));
