"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./form-dialog.module.css";
import {
  STORE_STATUS_OPTIONS,
  StoreRecord,
  getMutationErrorMessage,
  getApiUrl,
  publishFlash,
  readApiErrorMessage,
} from "@/lib/sellora";

type StoreFormDialogProps = {
  buttonLabel: string;
  buttonClassName?: string;
  store?: StoreRecord;
};

type StoreDraft = {
  store_name: string;
  owner_name: string;
  status: string;
  niche: string;
  url: string;
  notes: string;
};

function buildStoreDraft(store?: StoreRecord): StoreDraft {
  return {
    store_name: store?.store_name ?? "",
    owner_name: store?.owner_name ?? "",
    status: store?.status ?? STORE_STATUS_OPTIONS[0],
    niche: store?.niche ?? "",
    url: store?.url ?? "",
    notes: store?.notes ?? "",
  };
}

export function StoreFormDialog({
  buttonLabel,
  buttonClassName,
  store,
}: StoreFormDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<StoreDraft>(buildStoreDraft(store));

  const isEditMode = Boolean(store?.id);

  useEffect(() => {
    if (!isOpen) {
      setForm(buildStoreDraft(store));
      setError("");
    }
  }, [store, isOpen]);

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

  function updateField<Key extends keyof StoreDraft>(key: Key, value: StoreDraft[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const endpoint = isEditMode ? `/stores/${store?.id}` : "/stores/";
    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(getApiUrl(endpoint), {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            isEditMode ? "Unable to update store." : "Unable to create store.",
          ),
        );
      }

      publishFlash({
        kind: "success",
        title: isEditMode ? "Store updated successfully." : "Store created successfully.",
        body: isEditMode
          ? "The store workspace details are live now."
          : "Your new store workspace is ready for listings and branding work.",
      });
      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (caughtError) {
      setError(getMutationErrorMessage(caughtError, "Something went wrong while saving the store."));
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
          <div
            className={styles.dialog}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.header}>
              <div className={styles.heading}>
                <h3 className={styles.title}>
                  {isEditMode ? "Edit Store" : "Add Store"}
                </h3>
                <p className={styles.subtitle}>
                  {isEditMode
                    ? "Update the store workspace details without exposing the old desktop-only store code."
                    : "Create a new store workspace for the web app and keep the hidden legacy code in the backend only."}
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
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="store-name">
                    Store Name
                  </label>
                  <input
                    className={styles.control}
                    id="store-name"
                    onChange={(event) => updateField("store_name", event.target.value)}
                    required
                    value={form.store_name}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="owner-name">
                    Owner Name
                  </label>
                  <input
                    className={styles.control}
                    id="owner-name"
                    onChange={(event) => updateField("owner_name", event.target.value)}
                    required
                    value={form.owner_name}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="store-status">
                    Status
                  </label>
                  <select
                    className={styles.control}
                    id="store-status"
                    onChange={(event) => updateField("status", event.target.value)}
                    value={form.status}
                  >
                    {STORE_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="store-niche">
                    Niche
                  </label>
                  <input
                    className={styles.control}
                    id="store-niche"
                    onChange={(event) => updateField("niche", event.target.value)}
                    placeholder="Digital prints, jewelry, apparel..."
                    value={form.niche}
                  />
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor="store-url">
                    Store URL
                  </label>
                  <input
                    className={styles.control}
                    id="store-url"
                    onChange={(event) => updateField("url", event.target.value)}
                    placeholder="https://example.etsy.com"
                    value={form.url}
                  />
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor="store-notes">
                    Notes
                  </label>
                  <textarea
                    className={`${styles.control} ${styles.textarea}`}
                    id="store-notes"
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder="Anything important about the workflow, branding, or next actions for this store."
                    value={form.notes}
                  />
                  <div className={styles.hint}>
                    Keep this focused on what helps inside the store workspace.
                  </div>
                </div>
              </div>

              {error && (
                <div className={styles.error}>
                  <strong className={styles.messageTitle}>Could not save store</strong>
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
                  {isSaving
                    ? isEditMode
                      ? "Saving..."
                      : "Creating..."
                    : isEditMode
                      ? "Save Store"
                      : "Create Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
