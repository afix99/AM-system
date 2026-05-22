import Anthropic from "@anthropic-ai/sdk";
import { aiTools } from "@/lib/ai/tools";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Msg[] };

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "ANTHROPIC_API_KEY is not configured on the server." })}\n\n`,
      { headers: { "Content-Type": "text/event-stream" } },
    );
  }

  const client = new Anthropic();
  const today = new Date().toISOString().split("T")[0];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const runner = client.beta.messages.toolRunner({
          model: "claude-opus-4-7",
          max_tokens: 16000,
          system: [
            {
              type: "text",
              text: `${SYSTEM_PROMPT}\n\nToday's date is ${today}.`,
              cache_control: { type: "ephemeral" },
            },
          ],
          thinking: { type: "adaptive", display: "summarized" },
          output_config: { effort: "high" },
          tools: aiTools,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        });

        for await (const messageStream of runner) {
          for await (const event of messageStream) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                send({ type: "tool_use", name: event.content_block.name });
              } else if (event.content_block.type === "thinking") {
                send({ type: "thinking_start" });
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                send({ type: "text", text: event.delta.text });
              } else if (event.delta.type === "thinking_delta") {
                send({ type: "thinking", text: event.delta.thinking });
              }
            } else if (event.type === "content_block_stop") {
              // Nothing needed
            }
          }
        }

        send({ type: "done" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
