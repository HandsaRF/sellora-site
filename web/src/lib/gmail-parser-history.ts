import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

import {
  GmailParserLabResult,
  GmailParserLabRun,
} from "@/lib/gmail-parser-lab";

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const RUNS_PATH = path.join(DATA_DIR, "gmail-parser-lab-runs.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readRuns() {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(RUNS_PATH, "utf8");
    const parsed = JSON.parse(raw) as GmailParserLabRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeRuns(runs: GmailParserLabRun[]) {
  await ensureDataDir();
  await fs.writeFile(RUNS_PATH, JSON.stringify(runs, null, 2), "utf8");
}

export async function listGmailParserLabRuns(limit = 100) {
  const runs = await readRuns();
  return runs
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, limit);
}

export async function appendGmailParserLabRun(
  result: GmailParserLabResult,
  options: {
    sourceMessageId?: string | null;
  } = {},
) {
  const runs = await readRuns();
  const sourceMessageId = options.sourceMessageId ?? null;

  if (sourceMessageId) {
    const existingRun = runs.find((run) => run.source_message_id === sourceMessageId);

    if (existingRun) {
      return {
        run: existingRun,
        created: false,
      };
    }
  }

  const run: GmailParserLabRun = {
    id: randomUUID(),
    source_message_id: sourceMessageId,
    created_at: new Date().toISOString(),
    event_type: result.event_type,
    confidence: result.confidence,
    sender: result.sender,
    subject: result.subject,
    received_at: result.received_at,
    parsed_fields: result.parsed_fields,
    refund_fields: result.refund_fields,
    line_items: result.line_items,
    matched_fields: result.matched_fields,
    missing_fields: result.missing_fields,
    notes: result.notes,
    normalized_preview: result.normalized_preview,
  };

  runs.unshift(run);
  await writeRuns(runs.slice(0, 300));
  return {
    run,
    created: true,
  };
}
