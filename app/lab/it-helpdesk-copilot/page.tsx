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
            Three tickets are waiting in a fictional US company that runs SAP. Press Work this
            ticket and watch one get triaged: who raised it, whether the platform is healthy,
            whether a known fix already exists, and who it should go to.
          </p>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink">
            Every lookup it makes is shown beside the answer it produced, along with the protocol
            messages it sent to reach them. It cannot change anything without asking you first.
          </p>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink">
            Then give it a routing policy, start a new session, and work the same ticket again.
            Same ticket, same lookups, different answer.
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
              title="Four lookups, none of them guesses"
              body={[
                "Working one ticket took four calls: read the ticket, look up who raised it, check whether that SAP system is healthy, search the knowledge base. Each one is an ordinary function over ordinary data. The model ran none of them.",
                "It read a one line description of each and asked for one by name. The Copilot's code decided to comply. That is the whole of tool calling, and it is why the agent can say the platform is fine rather than assume it.",
              ]}
            />
            <Block
              n="02"
              title="Memory changed the answer, not the work"
              body={[
                "Give it a routing policy and work the same ticket again. The four lookups are identical, in the same order. The destination team is not, because a standing instruction outranked the team the ticket was assigned to.",
                "That policy lives outside the conversation, so it survived you starting a new session. One rule settles conflicts: restate it and the newest version wins.",
              ]}
            />
            <Block
              n="03"
              title="MCP is the door, not the tools"
              body={[
                "Every one of those lookups crossed the same boundary: connect, ask what exists, call one. Expand the messages under any answer to see them. The Copilot never imports the tool code, and it does not know what it can do until it asks.",
                "A second program with no model in it speaks the same three messages to the same server. That is what a standard buys: the second team does not need a copy of your agent.",
              ]}
            />
            <Block
              n="04"
              title="Reading is safe. Changing something is not."
              body={[
                "The four lookups ran on request. The escalation did not. The loop stopped, showed you the exact team it wanted to send the ticket to, and waited.",
                "That pause is not the model being careful. It is a few lines in the loop that refuse to run a write without an answer. Decline it and nothing happens, and the Copilot is told it was refused rather than left to imply it worked.",
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
