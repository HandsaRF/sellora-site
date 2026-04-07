"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./form-dialog.module.css";
import {
  LISTING_STATUS_OPTIONS,
  ListingRecord,
  getMutationErrorMessage,
  getApiUrl,
  publishFlash,
  readApiErrorMessage,
} from "@/lib/sellora";

type ListingFormDialogProps = {
  storeId: number;
  buttonLabel: string;
  buttonClassName?: string;
  listing?: ListingRecord;
};

type ListingDraft = {
  product_name: string;
  status: string;
  upload_date: string;
  sku: string;
};

function buildListingDraft(listing?: ListingRecord): ListingDraft {
  return {
    product_name: listing?.product_name ?? "",
    status: listing?.status ?? LISTING_STATUS_OPTIONS[0],
    upload_date: listing?.upload_date ?? "",
    sku: listing?.sku ?? "",
  };
}

export function ListingFormDialog({
  storeId,
  buttonLabel,
  buttonClassName,
  listing,
}: ListingFormDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ListingDraft>(buildListingDraft(listing));

  const isEditMode = Boolean(listing?.id);

  useEffect(() => {
    if (!isOpen) {
      setForm(buildListingDraft(listing));
      setError("");
    }
  }, [listing, isOpen]);

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

  function updateField<Key extends keyof ListingDraft>(key: Key, value: ListingDraft[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const endpoint = isEditMode
      ? `/stores/${storeId}/listings/${listing?.id}`
      : `/stores/${storeId}/listings`;
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
            isEditMode ? "Unable to update listing." : "Unable to create listing.",
          ),
        );
      }

      publishFlash({
        kind: "success",
        title: isEditMode ? "Listing updated successfully." : "Listing created successfully.",
        body: isEditMode
          ? "The store workspace now reflects the updated listing details."
          : "The new listing is now part of this store workspace.",
      });
      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (caughtError) {
      setError(getMutationErrorMessage(caughtError, "Something went wrong while saving the listing."));
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
                  {isEditMode ? "Edit Listing" : "Add Listing"}
                </h3>
                <p className={styles.subtitle}>
                  {isEditMode
                    ? "Keep listing edits inside this store workspace instead of relying on a separate global listings page."
                    : "Create a new listing directly inside the store workspace so the flow stays store-centered."}
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
                  <label className={styles.label} htmlFor={`product-name-${storeId}`}>
                    Product Name
                  </label>
                  <input
                    className={styles.control}
                    id={`product-name-${storeId}`}
                    onChange={(event) => updateField("product_name", event.target.value)}
                    required
                    value={form.product_name}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`listing-status-${storeId}`}>
                    Status
                  </label>
                  <select
                    className={styles.control}
                    id={`listing-status-${storeId}`}
                    onChange={(event) => updateField("status", event.target.value)}
                    value={form.status}
                  >
                    {LISTING_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`listing-sku-${storeId}`}>
                    SKU
                  </label>
                  <input
                    className={styles.control}
                    id={`listing-sku-${storeId}`}
                    onChange={(event) => updateField("sku", event.target.value)}
                    placeholder="Optional internal SKU"
                    value={form.sku}
                  />
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor={`listing-upload-date-${storeId}`}>
                    Upload Date
                  </label>
                  <input
                    className={styles.control}
                    id={`listing-upload-date-${storeId}`}
                    onChange={(event) => updateField("upload_date", event.target.value)}
                    type="date"
                    value={form.upload_date}
                  />
                  <div className={styles.hint}>
                    Leave this empty for drafts. If you mark a listing as Uploaded, the backend will fill today&apos;s date automatically.
                  </div>
                </div>
              </div>

              {error && (
                <div className={styles.error}>
                  <strong className={styles.messageTitle}>Could not save listing</strong>
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
                      ? "Save Listing"
                      : "Create Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
