import type { Metadata } from "next";
import { Footer, Header, SectionLabel } from "@/components/Chrome";

export const metadata: Metadata = {
  title: "How it works | IT Helpdesk Copilot",
  description:
    "The model never touches your systems. It asks, and your code decides. What a tool call is, what memory changes, and what MCP adds.",
};

export default function Page() {
  return (
    <>
      <Header current="guide" />

      <main className="mx-auto w-full max-w-5xl px-5">
        <section className="py-16">
          <SectionLabel>How it works</SectionLabel>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight text-navy md:text-5xl">
            The model never touches your systems. It asks, and your code decides.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink">
            Everything on the demo page follows from that one sentence. Four parts below. What a
            tool call is. What memory changes. What MCP adds. And where the asking stops.
          </p>
        </section>

        <Section n="01" label="Tool calling" title="A tool is code you already have">
          <p>
            The Copilot has six functions that read tickets, system status, employee access and
            knowledge base articles. Ordinary code. It worked before any model was involved and it
            would keep working if you deleted the model tomorrow.
          </p>
          <p>
            What makes that code a tool is the declaration written alongside it. A name. A sentence
            saying what it does and when to use it. A schema for the arguments. The model sees that
            and nothing else. Not the function, not the database.
          </p>
          <p>
            So when you asked whether SAP S/4HANA was up, the model did not check. It returned a
            small block of JSON naming one tool and one argument. The Copilot read that block, ran
            the function itself, and handed the result back.
          </p>
          <p className="border-l-2 border-accent pl-4 text-muted">
            Your code decides whether to comply. Run it. Refuse it. Log it. Stop and ask a human
            first. Every action an agent has ever taken was a line of somebody&rsquo;s code choosing
            to honour a request.
          </p>
        </Section>

        <Section n="02" label="Memory" title="A conversation forgets. Memory does not.">
          <p>
            A model is sent the whole conversation on every turn. That list is the only thing it
            remembers, and it dies when the session does. This is why most assistants make you
            repeat yourself.
          </p>
          <p>
            Memory is a second, much smaller place to write things down. Here it is your browser.
            State a fact and the Copilot stores it. Start a new session and a summary of everything
            stored is read back before you type a word.
          </p>
          <p>
            That is why the second step worked. The chat was empty. The fact was not, so the
            Copilot knew which team to escalate to without being told again.
          </p>
          <p>
            One rule decides conflicts. Restate a fact with a different value and the new value
            replaces the old one. The newest wins. That rule is fine for one operator and breaks at
            ten thousand, where facts have to be scoped to the person who stated them or one
            user&rsquo;s preference quietly overwrites another&rsquo;s.
          </p>
        </Section>

        <Section n="03" label="MCP" title="A standard door, so the second team does not need a copy">
          <p>
            These tools could have been wired straight into the Copilot. That works until a second
            team asks for access. Then there are two options. Hand over a copy of the code, which
            will drift from yours by the second week. Or agree on an interface both sides speak.
          </p>
          <p>
            The Model Context Protocol is the second option, written down. Three messages. Connect
            to the server. Ask what it offers. Call one of the things it offers.
          </p>
          <p>
            The Copilot never imports the tool code. It only speaks the protocol. That is why the
            button on the third step worked. A separate program, with no model inside it at all,
            asked the same server in the same way and got the same answer.
          </p>
          <p>
            What MCP does not do is worth naming plainly. It carries one call at a time, answered
            once, by one server. Two agents negotiating a task between themselves, asking each
            other questions before committing to anything, is a harder problem and a different
            protocol.
          </p>
        </Section>

        <Section n="04" label="Control" title="Reading is safe. Changing something is not.">
          <p>
            Six of the seven tools only read. Asking for one of those is cheap, and a wrong answer
            is the worst outcome. The seventh changes a ticket, and that is a different kind of
            request entirely.
          </p>
          <p>
            So the loop treats it differently. When the model asked to escalate, nothing ran. The
            loop stopped, handed back the exact tool name and arguments it had been asked for, and
            waited for a person. Approve and the tool runs. Decline and it never does, and the
            model is told plainly that the action was refused, so it reports that instead of
            claiming success.
          </p>
          <p>
            Nothing about that is the model being careful. The model asked for the same thing
            either way. The difference is a few lines in the loop that check whether a tool changes
            anything before running it.
          </p>
          <p className="border-l-2 border-accent pl-4 text-muted">
            This is the question worth settling before an agent reaches production, not after.
            While it only reads, a mistake is a wrong answer. The day it cancels an order, the same
            mistake is an incident.
          </p>
        </Section>

        <Section n="05" label="End to end" title="What happened when you pressed the button">
          <ol className="space-y-3 text-[15.5px] leading-relaxed text-ink">
            {[
              "Your browser sent the question, along with whatever facts it had stored.",
              "The server turned those facts into a short summary and put it in the model's instructions.",
              "It built a tool server and a client for this one request, then asked the client what tools existed.",
              "The model read the question and the tool list, and asked for a tool by name.",
              "If that tool only reads, the client passed the request across the protocol boundary and the server ran it. If it changes something, the loop stopped here and waited for you.",
              "The model read the result and answered in plain language. Anything worth remembering was written back to your browser.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-[13px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6">
            Steps four and five can repeat several times before the model has enough to answer. The
            demo shows each pass as its own line.
          </p>
        </Section>

        <section className="border-t border-border py-14">
          <div className="max-w-3xl rounded-lg border border-border bg-bg-secondary p-6">
            <p className="text-[14.5px] leading-relaxed text-muted">
              The protocol layer here is written by hand, with no MCP library, so the three messages
              are readable in about a hundred lines. Everything is in{" "}
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
