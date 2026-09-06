import { Footer, Header, SectionLabel } from "@/components/Chrome";

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 max-w-2xl">
      <div className="mb-2 font-mono text-[12px] text-muted">{n}</div>
      <h2 className="mb-4 font-serif text-2xl text-navy">{title}</h2>
      <div className="space-y-4 text-[14.5px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <>
      <Header current="guide" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <SectionLabel>Concepts</SectionLabel>
        <h1 className="mb-4 max-w-2xl font-serif text-[32px] leading-tight text-navy sm:text-[38px]">
          How this Copilot actually works
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
          Ask a large language model to check a ticket, and it cannot. It has no ticket system.
          What it has is a description of one, written by a developer, and a habit of asking
          politely for that description to be acted on. Everything on this page is about what
          happens between the question you asked in the demo and the answer that came back, and
          why each piece of that pipeline exists.
        </p>

        <Section n="01" title="Tool calling: the model never runs your code">
          <p>
            The common explanation for how an AI assistant &ldquo;looks something up&rdquo; is
            that it goes and checks. It does not. A language model produces text, one token at a
            time, and nothing else. It cannot open a database connection, and it cannot call a
            function in your codebase, because it does not run inside your codebase at all. It
            runs on a separate server, reachable only through an API that accepts text and
            returns text.
          </p>
          <p>
            What actually happens is narrower and more mechanical. The developer hands the model
            a list of tool declarations: a name, a description of what each one does, and the
            shape of the arguments it expects. When a question needs one, the model does not run
            it. It writes out, as structured text, which tool it wants and what arguments to pass.
            The application reads that text, decides whether to honour it, runs the real function
            if so, and sends the result back as another message. The model was never in control
            of that decision. It only ever asked.
          </p>
          <p>
            This is why a tool&rsquo;s written description matters more than most people expect.
            The model has no access to the underlying code, so a vague description
            (&ldquo;checks tickets&rdquo;) and a precise one (&ldquo;returns status, priority, and
            assigned team for a ticket ID such as INC0048213&rdquo;) are the entire difference
            between the model picking the right tool with the right arguments, and guessing.
          </p>
        </Section>

        <Section n="02" title="Memory: what survives, and what does not">
          <p>
            A conversation with a model lives inside something called a context window: the full
            list of messages sent back and forth, resubmitted in full on every turn. Anything in
            that list is available to the model. Close the tab, and the list is gone. This is why
            most assistants forget a preference stated five minutes earlier once a new session
            starts. There was never anywhere else for it to live.
          </p>
          <p>
            Persistent memory solves a narrower problem than it sounds like it should. It does
            not give the model a bigger context window. It gives it a second, much smaller place
            to write things down, one that outlives the conversation. In this demo, that place is
            the browser&rsquo;s local storage rather than a database, chosen deliberately so the
            demo needs no server-side data store at all. State a fact, and the Copilot calls a
            <code className="mx-1 rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] text-ink">
              remember
            </code>
            tool that writes it there. Start a new session, and a short summary of everything
            stored is read back in before the first message is even sent, the same way it would
            be read from a file on disk in a server-side system.
          </p>
          <p>
            One decision matters more than it looks like it should: what happens when a fact is
            restated with a different value. This system uses last write wins. The newest value
            for a given key replaces the old one outright, and the old value is kept only as a
            quiet audit trail, never shown back to the model or the user as a live alternative. A
            system storing memory for ten thousand users at once would need to go further: facts
            need to be scoped to the person who stated them, not stored in one shared list, or one
            user&rsquo;s preference will silently overwrite another&rsquo;s.
          </p>
        </Section>

        <Section n="03" title="MCP: a standard door, not a private import">
          <p>
            The tools in this demo could have been wired directly into the code that talks to the
            model, the way most first attempts at an AI assistant are built. That works until a
            second team asks for access to the same tools. At that point the honest options are a
            copy of the code, which will drift, or a shared interface that both sides agree to
            speak. The Model Context Protocol is that second option, standardised.
          </p>
          <p>
            It defines three message types, each shaped like a JSON-RPC call: a request carries a
            method name, its arguments, and an ID; a response carries the same ID back, with
            either a result or an error, never both.
            <code className="mx-1 rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] text-ink">
              initialize
            </code>
            is a handshake between a client and a server.
            <code className="mx-1 rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] text-ink">
              tools/list
            </code>
            asks the server what it can do.
            <code className="mx-1 rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] text-ink">
              tools/call
            </code>
            asks it to actually do one of those things. Nothing about this demo uses a real
            network connection for that exchange, since client and server run inside the same
            request, but the messages passed between them are shaped exactly as they would be if
            they did.
          </p>
          <p>
            The arrangement has three named roles. The Host is the part that owns the
            conversation with the model and decides when a tool is needed, in this case the agent
            loop behind the chat you were using. The Client is the only thing the Host is allowed
            to speak to. It never touches a tool&rsquo;s real implementation. The Server is the
            other side of that boundary: it holds the actual tool functions, and answers only
            those three message types. A second consumer, built by someone who has never seen the
            Host&rsquo;s code, could reach the same tools through the same Client interface and
            get identical behaviour.
          </p>
          <p>
            What this protocol does not solve is worth naming honestly. It standardises one tool
            call at a time, answered once, by one server. It says nothing about two independent
            agents negotiating a task together, asking each other clarifying questions before
            committing to an answer. That is a different, harder problem, and a different
            protocol&rsquo;s job.
          </p>
        </Section>

        <Section n="04" title="This demo's own request, start to finish">
          <p>
            One message sent from the chat box takes this path. Your browser reads whatever facts
            are currently in local storage and sends them, along with the conversation so far, to
            a server function. That function builds a short text summary of those facts and adds
            it to the model&rsquo;s instructions, so the model already knows them without being
            asked. It also builds a fresh Client and Server pair for this one request, and asks
            the Client which tools exist.
          </p>
          <p>
            The model is then sent the conversation and the tool list together. If it decides a
            tool is needed, it says so in its response rather than running anything. The server
            takes that request, sends it through the Client to the Server as a
            <code className="mx-1 rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] text-ink">
              tools/call
            </code>
            message, gets a result back, and hands that result to the model as the next message
            in the conversation. This can repeat several times for one question. Once the model
            has enough to answer in plain language, it does, and that answer, along with every
            JSON-RPC message exchanged along the way, is sent back to your browser. Any new facts
            the model chose to remember are written to local storage at that point, ready for the
            next session.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
