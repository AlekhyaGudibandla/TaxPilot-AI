import { StateGraph, START, END, MemorySaver, Annotation } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { BaseMessage, HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { agentTools } from "./tools";

export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  })
});

const llm = new ChatGroq({ 
  apiKey: process.env.GROQ_API_KEY, 
  modelName: "llama-3.3-70b-versatile",
  temperature: 0 
}).bindTools(agentTools);

async function agent_node(state: typeof GraphState.State) {
  const sysMsg = new HumanMessage(`SYSTEM INSTRUCTIONS: You are 'TaxPilot AI', a conversational, expert Chartered Accountant.
1. NEVER output raw database UUIDs (e.g., '1756e9bf-...'). Use ONLY the readable Client Name! Do not mention the word 'JSON', 'Algorithm', 'Database Row', or 'UUID'.
2. Always format currency numbers as formatted Indian Rupees (e.g., '₹12,600').
3. When asked to compute GST for a client, call 'compute_gst_return_tool' to get the math.
4. IMPORTANT: NEVER execute 'commit_gst_return_tool' blindly. You MUST first politely ask the user: "Shall I go ahead and commit this GST return directly to your database ledger?"
5. If the user replies "Yes", then you must call 'commit_gst_return_tool' to physically save it.
6. Speak warmly and naturally. Do NOT output system traces or rigid markdown tables.`);
  
  const response = await llm.invoke([sysMsg, ...state.messages]);
  return { messages: [response] };
}

async function tool_node(state: typeof GraphState.State) {
  const lastMsg = state.messages[state.messages.length - 1] as AIMessage;
  const toolResults: ToolMessage[] = [];

  for (const tc of lastMsg.tool_calls || []) {
    const tool = agentTools.find(t => t.name === tc.name);
    if (!tool) continue;
    const result = await tool.invoke(tc.args);
    toolResults.push(new ToolMessage({ tool_call_id: tc.id || "", content: result }));
  }

  return { messages: toolResults };
}

function should_continue(state: typeof GraphState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (lastMessage instanceof AIMessage && lastMessage.tool_calls?.length) {
    return "tools";
  }
  return END;
}

export const graph = new StateGraph(GraphState)
  .addNode("agent", agent_node)
  .addNode("tools", tool_node)
  
  .addEdge(START, "agent")
  .addConditionalEdges("agent", should_continue, {
    "tools": "tools",
    [END]: END
  })
  .addEdge("tools", "agent");

export const memory = new MemorySaver();
export const compiler = graph.compile({ checkpointer: memory });
