import { compiler } from './src/agents/graph';
import { HumanMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const config = { configurable: { thread_id: Date.now().toString() } };
  const state = await compiler.invoke(
    { messages: [new HumanMessage("Audit all invoices for Client bfa20be1-3259-4f4d-8721-68742787084f and compute summary")] },
    config
  );
  console.log("FINAL STATE LOGS:\n", state.execution_log.join('\n- '));
  console.log("FINAL DRAFT:\n", state.final_draft);
}

run().catch(console.error);
