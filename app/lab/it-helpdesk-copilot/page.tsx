import { Footer, Header, SectionLabel } from "@/components/Chrome";
import { HelpdeskDemo } from "@/components/HelpdeskDemo";

function Block({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[12px] text-muted">{n}</div>
      <h3 className="mb-2 font-serif text-[17px] text-navy">{title}</h3>
      <p className="text-[13.5px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Header current="lab" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <SectionLabel>Live demo</SectionLabel>
        <span className="tag-badge mb-4 inline-block">Tool calling · Memory · MCP</span>
        <h1 className="mb-4 max-w-2xl font-serif text-[34px] leading-tight text-navy sm:text-[40px]">
          An IT helpdesk agent that remembers you, and shows its work.
        </h1>
        <p className="mb-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          This is a small AI Operations Copilot for a fictional, USA-based company running SAP.
          It answers ticket, system-status, and access questions by calling real tools against a
          mock database. Nothing here is hand-scripted: every reply below is a live model call
          deciding which tool to use, with what arguments, in what order.
        </p>
        <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-muted">
          Tell it something worth remembering, click &ldquo;New session,&rdquo; and ask a
          follow-up that only resolves correctly if that fact survived. The panel on the right
          shows the raw protocol messages behind every tool call - the same JSON-RPC shape a real
          Model Context Protocol server and client would exchange.
        </p>

        <HelpdeskDemo />

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <Block
            n="01"
            title="A tool call, not a guess"
            body="The model never touches the ticket database directly. It reads a text description of what each tool does, and asks the Copilot's code to run one. The code decides whether to comply."
          />
          <Block
            n="02"
            title="Memory outside the conversation"
            body="Facts you state are written to this browser's storage, not the chat history. Reload the page, come back tomorrow - the fact is still there, because it never depended on the conversation surviving."
          />
          <Block
            n="03"
            title="A protocol boundary, not an import"
            body="Every tool call crosses a hand-built MCP-shaped boundary: initialize, tools/list, tools/call. The agent never imports the tool functions directly - it only ever knows the client."
          />
        </div>

        <div className="mt-16 max-w-2xl rule-top pt-10">
          <h2 className="mb-4 font-serif text-2xl text-navy">Why this matters</h2>
          <p className="mb-4 text-[14.5px] leading-relaxed text-muted">
            Most internal AI assistants stop at the first version of the two problems this demo
            is built around: they forget everything the moment a session ends, and their tools
            are wired directly into one codebase, unreachable by any other team's agent without a
            copy-paste. Neither problem is exotic. Both show up the first week a second team asks
            to use &ldquo;the tools,&rdquo; or the first time a user has to re-explain something
            they already said yesterday.
          </p>
          <p className="text-[14.5px] leading-relaxed text-muted">
            Read the{" "}
            <a href="/guide" className="text-accent hover:underline">
              concepts guide
            </a>{" "}
            for how tool calling, persistent memory, and the Model Context Protocol actually work
            underneath this page, or see the{" "}
            <a
              href="https://github.com/rupeshpanda/it-helpdesk-copilot"
              className="text-accent hover:underline"
            >
              source on GitHub
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
