"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./form-dialog.module.css";
import {
  GMAIL_CONNECTION_STATUS_OPTIONS,
  GmailConnectionRecord,
  getMutationErrorMessage,
  publishFlash,
  readApiErrorMessage,
} from "@/lib/sellora";

type GmailConnectionDialogProps = {
  storeId: number;
  buttonLabel: string;
  buttonClassName?: string;
  connection: GmailConnectionRecord;
};

type GmailConnectionDraft = {
  gmail_account_email: string;
  connection_status: GmailConnectionRecord["connection_status"];
  inbox_label: string;
  sync_notes: string;
  last_synced_at: string;
};

function buildDraft(connection: GmailConnectionRecord): GmailConnectionDraft {
  return {
    gmail_account_email: connection.gmail_account_email ?? "",
    connection_status: connection.connection_status,
    inbox_label: connection.inbox_label ?? "",
    sync_notes: connection.sync_notes ?? "",
    last_synced_at: connection.last_synced_at ?? "",
  };
}

export function GmailConnectionDialog({
  storeId,
  buttonLabel,
  buttonClassName,
  connection,
}: GmailConnectionDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<GmailConnectionDraft>(buildDraft(connection));

  useEffect(() => {
    if (!isOpen) {
      setForm(buildDraft(connection));
      setError("");
    }
  }, [connection, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSaving]);

  function updateField<Key extends keyof GmailConnectionDraft>(
    key: Key,
    value: GmailConnectionDraft[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/stores/${storeId}/gmail-connection`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "Unable to save the Gmail connection state.",
          ),
        );
      }

      publishFlash({
        kind: "success",
        title: "Gmail connection state saved.",
        body: "This store now has its own Gmail slot ready for the future Etsy transaction import flow.",
      });
      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (caughtError) {
      setError(
        getMutationErrorMessage(
          caughtError,
          "Something went wrong while saving the Gmail connection state.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        className={buttonClassName ?? styles.defaultTrigger}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={() => {
            if (!isSaving) {
              setIsOpen(false);
            }
          }}
        >
          <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
            <div className={styles.header}>
              <div className={styles.heading}>
                <h3 className={styles.title}>Store Gmail</h3>
                <p className={styles.subtitle}>
                  Each store gets its own Gmail connection state so the future Etsy transaction parser has a clear home.
                </p>
              </div>
              <button
                aria-label="Close dialog"
                className={styles.closeButton}
                disabled={isSaving}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                x
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.grid}>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor={`gmail-account-${storeId}`}>
                    Gmail Account Email
                  </label>
                  <input
                    className={styles.control}
                    id={`gmail-account-${storeId}`}
                    onChange={(event) => updateField("gmail_account_email", event.target.value)}
                    placeholder="storemail@gmail.com"
                    type="email"
                    value={form.gmail_account_email}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`gmail-status-${storeId}`}>
                    Connection Status
                  </label>
                  <select
                    className={styles.control}
                    id={`gmail-status-${storeId}`}
                    onChange={(event) =>
                      updateField(
                        "connection_status",
                        event.target.value as GmailConnectionDraft["connection_status"],
                      )
                    }
                    value={form.connection_status}
                  >
                    {GMAIL_CONNECTION_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`gmail-last-sync-${storeId}`}>
                    Last Sync Date
                  </label>
                  <input
                    className={styles.control}
                    id={`gmail-last-sync-${storeId}`}
                    onChange={(event) => updateField("last_synced_at", event.target.value)}
                    type="date"
                    value={form.last_synced_at}
                  />
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor={`gmail-label-${storeId}`}>
                    Inbox Label / Folder
                  </label>
                  <input
                    className={styles.control}
                    id={`gmail-label-${storeId}`}
                    onChange={(event) => updateField("inbox_label", event.target.value)}
                    placeholder="etsy-transactions"
                    value={form.inbox_label}
                  />
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor={`gmail-notes-${storeId}`}>
                    Sync Notes
                  </label>
                  <textarea
                    className={`${styles.control} ${styles.textarea}`}
                    id={`gmail-notes-${storeId}`}
                    onChange={(event) => updateField("sync_notes", event.target.value)}
                    placeholder="Anything important about this store mailbox, parsing rules, or sync status."
                    value={form.sync_notes}
                  />
                </div>
              </div>

              {error && (
                <div className={styles.error}>
                  <strong className={styles.messageTitle}>Could not save Gmail state</strong>
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.footer}>
                <button
                  className={styles.secondaryAction}
                  disabled={isSaving}
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button className={styles.primaryAction} disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : "Save Gmail State"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
