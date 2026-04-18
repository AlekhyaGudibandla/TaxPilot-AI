import { prisma } from './src/index';
import { calculateGSTLiability } from './src/services/gstCalculator';

async function run() {
  const cl = await prisma.client.findFirst({ where: { name: 'Client A' } });
  if (cl) {
    const r = await calculateGSTLiability(cl.id, '2024-04', true);
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log('Client A not found in DB');
  }
}
run().then(() => process.exit(0));
