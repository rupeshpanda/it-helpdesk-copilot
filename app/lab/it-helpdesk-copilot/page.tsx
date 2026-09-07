import { Footer, Header } from "@/components/Chrome";
import { HelpdeskDemo } from "@/components/HelpdeskDemo";

export default function Page() {
  return (
    <>
      <Header current="lab" />

      <main className="mx-auto w-full max-w-5xl px-5">
        <section className="pt-14 pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="tag-badge">Tool calling</span>
            <span className="tag-badge">Memory</span>
            <span className="tag-badge">MCP</span>
            <span className="tag-badge">Live demo</span>
          </div>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight text-navy md:text-5xl">
            IT Helpdesk Copilot
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink">
            A helpdesk agent for a fictional US company that runs SAP. It answers from real tools
            over mock data, and every reply is a live model call.
          </p>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink">
            Everything it does is shown next to the answer it produced. Which tools it called. The
            messages it sent to reach them. What it wrote down to remember. And the moment it asks
            permission before changing anything.
          </p>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink">
            Try the four suggestions in order. The third works only because of the second.
          </p>
        </section>

        <section className="pb-14">
          <HelpdeskDemo />
        </section>

        <section className="border-t border-border py-14">
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">What just happened</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Block
              n="01"
              title="The model never touched the data"
              body={[
                "It read a one line description of each tool and asked for one by name. The Copilot's code ran it and handed back the result. That is the whole of tool calling.",
                "The description is the interface. Change it and the model changes what it asks for.",
              ]}
            />
            <Block
              n="02"
              title="Memory is outside the chat"
              body={[
                "The fact you stated was written to this browser, not to the conversation. You started over and the chat was empty. The fact was not.",
                "One rule decides conflicts. The newest value wins.",
              ]}
            />
            <Block
              n="03"
              title="MCP is the door, not the tools"
              body={[
                "The Model Context Protocol fixes how an agent asks for a tool: connect, list, call. The Copilot never imports the tool code. It only speaks the protocol.",
                "So a second program spoke it too, with no model at all, and got the same answer from the same server.",
              ]}
            />
            <Block
              n="04"
              title="Reading is safe. Changing something is not."
              body={[
                "Every tool that only reads ran on request. The one that changes a ticket did not. The loop stopped, showed you the exact action, and waited.",
                "That pause is not the model being careful. It is six lines in the agent loop that refuse to execute a write without an answer. Approve it and the tool runs. Decline it and nothing does, and the Copilot is told so rather than left to guess.",
              ]}
            />
          </div>
        </section>

        <section className="border-t border-border py-14">
          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl leading-snug text-navy">Why this matters more than it looks</h2>
            <p className="mt-5 text-[16px] leading-relaxed text-ink">
              Most internal assistants have both problems this page shows. They forget everything
              when the session ends. Their tools are wired into one codebase.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              Neither shows up in a demo. Both show up the first week a second team asks for
              access, or the first time a user has to repeat what they said yesterday.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              A standard door costs little to build. Copying tools into a second codebase costs
              something every week after.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              The third problem arrives later, and it is the one worth deciding early. Every tool
              here reads, except one. While an agent only reads, a mistake is a wrong answer. The
              day it cancels a booking or reassigns a gate, the same mistake is an incident. The
              boundary in step four is what separates those two situations, and it is a property of
              your code, not of the model.
            </p>
            <p className="mt-6 text-[15px] leading-relaxed text-ink">
              If you want the mechanism, including the exact messages,{" "}
              <a href="/guide" className="text-accent underline underline-offset-2 hover:text-accent-hover">
                read the guide
              </a>
              .
            </p>
            <div className="mt-8 rounded-lg border border-border bg-bg-secondary p-6">
              <p className="text-[14.5px] leading-relaxed text-muted">
                Every reply above is live. It is made when you press the button. Nothing is
                scripted and no run is selected. The code is in{" "}
                <a
                  href="https://github.com/rupeshpanda/it-helpdesk-copilot"
                  className="text-accent underline underline-offset-2 hover:text-accent-hover"
                >
                  the repository
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Block({ n, title, body }: { n: string; title: string; body: string[] }) {
  return (
    <div>
      <span className="section-label">{n}</span>
      <h3 className="font-serif text-xl leading-snug text-navy">{title}</h3>
      {body.map((p, i) => (
        <p key={i} className="mt-3 text-[14.5px] leading-relaxed text-ink">
          {p}
        </p>
      ))}
    </div>
  );
}
