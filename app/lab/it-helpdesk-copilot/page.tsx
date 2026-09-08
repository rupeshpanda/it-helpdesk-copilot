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
            One SAP helpdesk ticket. One model. Three configurations, run side by side at the same
            moment.
          </p>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink">
            The first has no tools. The second has eight. The third has the same eight and one
            sentence it was told to remember a week ago. Nothing else differs.
          </p>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink">
            Press the button and watch where they separate.
          </p>
        </section>

        <section className="pb-14">
          <HelpdeskDemo />
        </section>

        <section className="border-t border-border py-14">
          <h2 className="max-w-3xl font-serif text-3xl leading-snug text-navy">What just happened</h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Block
              n="01"
              title="A tool is permission to look something up"
              body={[
                "The first column is the model by itself. It cannot see a ticket, a system or a person, and it rarely says so. It usually writes the triage anyway: a requester who does not work here, a system this ticket is not about, a knowledge base article that does not exist, and a recommendation formatted exactly like the other two columns.",
                "Read it next to column two and the invention is obvious. Read it alone, on a Tuesday, in a queue of forty, and it is not obvious at all. Nothing in it is flagged. No error is raised. It is wrong in the shape of being right.",
                "A tool is an ordinary function you already have, wrapped in a written description. Your ticket system, your directory, your monitoring. The model runs none of them. It reads the descriptions, asks for one by name, and your code decides whether to comply. The difference between the first column and the second is not intelligence. It is reach.",
              ]}
            />
            <Block
              n="02"
              title="Memory is policy that outlives the conversation"
              body={[
                "The second and third columns made the same four lookups in the same order. They disagreed about where the ticket should go.",
                "The third had been told, in some earlier session, that California offices route to Basis East. That sentence was not in the conversation. It was read back out of storage before the first word was sent, so the agent applied a standing instruction nobody repeated.",
                "This is what memory is for in an operation. Not remembering chat. Retaining the rules your people would otherwise have to restate every morning.",
              ]}
            />
            <Block
              n="03"
              title="MCP is the door the tools sit behind"
              body={[
                "The agent did not start out knowing it had eight tools. It connected to a tool server, asked what existed, and chose from the answer. Three messages, always the same shape.",
                "That indirection is the whole point. The tool list is a property of the server, not of the agent, so what an agent may touch becomes something you configure rather than something you rewrite.",
                "And a second program can use the same door. The other team does not need a copy of your code, which is the version of this problem that shows up in month two.",
              ]}
            />
          </div>
        </section>

        <section className="border-t border-border py-14">
          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl leading-snug text-navy">
              Why this matters more than it looks
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-ink">
              The first column is where most internal AI pilots stop. A capable model, no access to
              anything, and a demo that impresses in a meeting and cannot close a ticket.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              The distance between column one and column two is not a better model. It is
              integration work, and it is the part nobody budgets for.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              The distance between column two and column three is smaller and easier to miss. Both
              answers look competent. One of them ignores a routing rule your service desk lead set
              in March, and nothing in the output says so.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">
              Notice also what none of the three columns did. Not one of them changed anything. The
              agent proposed an escalation and stopped, because a tool that writes is held until a
              person answers. While an agent only reads, a mistake is a wrong answer. The day it
              reassigns a real ticket, the same mistake is an incident, and the boundary that
              separates those two situations is in your code, not in the model.
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
                Every run above is live and made when you press the button. Nothing is scripted and
                no run is selected. The ticket, the employees and the systems are invented. The
                code is in{" "}
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
