import type { Metadata } from "next";
import { Footer, Header, SectionLabel } from "@/components/Chrome";

export const metadata: Metadata = {
  title: "How it works | IT Helpdesk Copilot",
  description:
    "What a tool is, what memory changes, what MCP adds, and where an agent must stop and ask. Written for people deciding whether to build one.",
};

export default function Page() {
  return (
    <>
      <Header current="guide" />

      <main className="mx-auto w-full max-w-5xl px-5">
        <section className="py-16">
          <SectionLabel>How it works</SectionLabel>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight text-navy md:text-5xl">
            A model that cannot reach anything will still answer you.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink">
            That is the problem the first column on the demo page exists to show, and it is where
            most internal AI work starts. Four parts below. What a tool is. What memory changes.
            What MCP adds. And where an agent has to stop and ask a person.
          </p>
        </section>

        <Section n="01" label="Tools" title="A tool is code you already have">
          <p>
            Nothing about a tool is an AI idea. The Copilot has six functions that read tickets,
            employee records, system health and knowledge base articles. Ordinary code. It worked
            before any model was involved and it would keep working if you deleted the model
            tomorrow.
          </p>
          <p>
            What turns that code into a tool is the declaration written beside it. A name. A
            sentence saying what it does and when to use it. A schema for the arguments. The model
            sees that and nothing else. Not the function, not the database, not the row it returns
            until it asks.
          </p>
          <p>
            So the model never checks anything. It writes out, as structured text, which tool it
            wants and what to pass. Your program reads that, decides whether to honour it, runs the
            real function, and hands the result back. Every action an agent has ever taken was a
            line of somebody&rsquo;s code choosing to comply.
          </p>
          <p className="border-l-2 border-accent pl-4 text-muted">
            This is also why the wording matters more than people expect. A vague description gets
            you a tool called with the wrong argument, and a tool called with the wrong argument
            returns a perfectly valid answer to a question nobody asked.
          </p>
        </Section>

        <Section n="02" label="Memory" title="A conversation forgets. An operation cannot.">
          <p>
            A model is sent the whole conversation on every turn. That list is the only thing it
            knows, and it dies when the session does. This is why most assistants make a person
            repeat themselves, and why they cannot hold a rule for longer than an afternoon.
          </p>
          <p>
            Memory is a second, much smaller place to write things down, read back before the first
            word of the next session. In this demo it is your browser, chosen so the lab needs no
            database. In a real deployment it is a table.
          </p>
          <p>
            What goes in it is the interesting part. Not chat history. Policy. The third column on
            the demo page has one sentence in memory: California offices route to Basis East. That
            sentence changed where a ticket went, a week after somebody said it, without anyone
            repeating it. That is the difference between an assistant and a colleague who has
            worked here a while.
          </p>
          <p>
            One rule settles conflicts. Restate a fact and the new value replaces the old one. That
            is fine for one service desk and it breaks at ten thousand users, where facts have to be
            scoped to whoever stated them or one person&rsquo;s preference quietly becomes
            everybody&rsquo;s.
          </p>
        </Section>

        <Section n="03" label="MCP" title="A standard door, so the second team does not need a copy">
          <p>
            The tools could have been wired straight into the Copilot. That works until a second
            team asks for access. Then there are two options. Hand over a copy of the code, which
            will drift from yours inside a month. Or agree on an interface both sides speak.
          </p>
          <p>
            The Model Context Protocol is the second option, written down. Three messages. Connect
            to the tool server. Ask what it offers. Call one of the things it offers.
          </p>
          <p>
            Notice the middle one. The agent does not know what it can do until it asks. Its
            capabilities are a property of the server, not of its own code, which means what an
            agent may touch becomes something you configure rather than something you rewrite. For
            anyone who has to answer for what a system is allowed to do, that is the whole
            attraction.
          </p>
          <p>
            What MCP does not do is worth saying plainly. It carries one request at a time,
            answered once, by one server. Two agents negotiating a task between themselves, asking
            each other questions before committing to anything, is a harder problem and a different
            protocol.
          </p>
        </Section>

        <Section n="04" label="Control" title="Reading is safe. Changing something is not.">
          <p>
            Six of the seven tools only read. The seventh changes a ticket, and the loop treats it
            differently. When the model asked to escalate, nothing ran. It returned the exact tool
            and arguments it wanted, and waited.
          </p>
          <p>
            Approve and the call executes. Decline and it never does, and the model is told plainly
            that it was refused, so it reports the refusal instead of writing a summary implying the
            work was done.
          </p>
          <p>
            None of that is the model being careful. It asked for the same thing either way. The
            difference is a few lines in the loop that check whether a tool changes anything before
            running it.
          </p>
          <p className="border-l-2 border-accent pl-4 text-muted">
            Settle this before an agent reaches production, not after. While it only reads, a
            mistake is a wrong answer. The day it reassigns a real ticket, the same mistake is an
            incident.
          </p>
        </Section>

        <Section n="05" label="End to end" title="What happens when you press the button">
          <ol className="space-y-3 text-[15.5px] leading-relaxed text-ink">
            {[
              "Three runs start at once, one per column. Same ticket, same model, same instructions.",
              "Each one is given whatever memory its column has, folded into the model's instructions before the question.",
              "The two columns with tools build a tool server and a client, then ask the client what exists.",
              "The model reads the question and the tool list, and asks for a tool by name.",
              "The client carries that request across the protocol boundary. The server runs the function and returns the result. This repeats until the model has enough.",
              "If it asks for something that changes a ticket, the loop stops there and reports the proposal instead of running it.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-[13px] text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        <section className="border-t border-border py-14">
          <div className="max-w-3xl rounded-lg border border-border bg-bg-secondary p-6">
            <p className="text-[14.5px] leading-relaxed text-muted">
              The protocol layer is written by hand, with no MCP library, so the three messages are
              readable in about a hundred lines. Everything is in{" "}
              <a
                href="https://github.com/rupeshpanda/it-helpdesk-copilot"
                className="text-accent underline underline-offset-2 hover:text-accent-hover"
              >
                the repository
              </a>
              , or go back to{" "}
              <a
                href="/lab/it-helpdesk-copilot"
                className="text-accent underline underline-offset-2 hover:text-accent-hover"
              >
                the demo
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Section({
  n,
  label,
  title,
  children,
}: {
  n: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-14">
      <SectionLabel>
        {n} · {label}
      </SectionLabel>
      <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">{title}</h2>
      <div className="mt-5 max-w-2xl space-y-4 text-[15.5px] leading-relaxed text-ink">
        {children}
      </div>
    </section>
  );
}
