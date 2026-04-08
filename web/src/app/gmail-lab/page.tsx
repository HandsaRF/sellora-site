import type { Metadata } from "next";

import { GmailParserLab } from "@/components/GmailParserLab";
import { getGmailLabConnectionState } from "@/lib/gmail-lab-connection";
import { listGmailParserLabRuns } from "@/lib/gmail-parser-history";

export const metadata: Metadata = {
  title: "Sellora Gmail Parser Lab",
  description: "Separate Etsy Gmail parsing lab for testing before workspace integration.",
};

export default async function GmailLabPage() {
  const [runs, connection] = await Promise.all([
    listGmailParserLabRuns(),
    getGmailLabConnectionState(),
  ]);

  return <GmailParserLab initialRuns={runs} initialConnection={connection} />;
}
