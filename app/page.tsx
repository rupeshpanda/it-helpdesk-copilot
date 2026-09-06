import { redirect } from "next/navigation";

/** The lab lives at /lab/it-helpdesk-copilot so this app's routes line up
 *  with eleganceai.ai/lab/<slug>. The root just forwards there. */
export default function Home() {
  redirect("/lab/it-helpdesk-copilot");
}
