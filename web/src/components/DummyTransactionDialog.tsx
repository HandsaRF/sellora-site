"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./form-dialog.module.css";
import {
  ListingRecord,
  PurchaseTransactionRecord,
  getMutationErrorMessage,
  publishFlash,
  readApiErrorMessage,
  resolveListingProductCost,
} from "@/lib/sellora";

type DummyTransactionDialogProps = {
  storeId: number;
  listings: ListingRecord[];
  buttonLabel: string;
  buttonClassName?: string;
  transaction?: PurchaseTransactionRecord;
};

type DummyTransactionDraft = {
  matched_listing_id: string;
  listing_title: string;
  style: string;
  transaction_id: string;
  quantity: string;
  subtotal_usd: string;
  product_cost_snapshot_usd: string;
  supplier_shipping_cost_usd: string;
  estimated_fees_usd: string;
  extra_cost_usd: string;
  event_date: string;
  review_notes: string;
};

function buildDraft(
  listings: ListingRecord[],
  transaction?: PurchaseTransactionRecord,
): DummyTransactionDraft {
  const firstListing = listings[0];
  const matchedListingId =
    transaction?.matched_listing_id != null
      ? String(transaction.matched_listing_id)
      : firstListing
        ? String(firstListing.id)
        : "";

  const matchedListingTitle =
    transaction?.listing_title ?? firstListing?.product_name ?? "";
  const initialListing =
    transaction?.matched_listing_id != null
      ? listings.find((listing) => listing.id === transaction.matched_listing_id)
      : firstListing;
  const initialStyle =
    transaction?.style ??
    (initialListing?.style_options && initialListing.style_options.length > 0
      ? initialListing.style_options[0] ?? ""
      : "");
  const initialProductCost =
    transaction?.product_cost_snapshot_usd != null
      ? String(transaction.product_cost_snapshot_usd)
      : resolveListingProductCost(initialListing, initialStyle) != null
        ? String(resolveListingProductCost(initialListing, initialStyle))
        : "";

  return {
    matched_listing_id: matchedListingId,
    listing_title: matchedListingTitle,
    style: initialStyle,
    transaction_id: transaction?.transaction_id ?? "",
    quantity: String(transaction?.quantity ?? 1),
    subtotal_usd:
      transaction?.subtotal_usd != null ? String(transaction.subtotal_usd) : "",
    product_cost_snapshot_usd: initialProductCost,
    supplier_shipping_cost_usd:
      transaction?.supplier_shipping_cost_usd != null
        ? String(transaction.supplier_shipping_cost_usd)
        : "",
    estimated_fees_usd:
      transaction?.estimated_fees_usd != null
        ? String(transaction.estimated_fees_usd)
        : "",
    extra_cost_usd:
      transaction?.extra_cost_usd != null ? String(transaction.extra_cost_usd) : "",
    event_date: transaction?.event_date ?? new Date().toISOString().slice(0, 10),
    review_notes: transaction?.review_notes ?? "",
  };
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return Number(trimmed);
}

export function DummyTransactionDialog({
  storeId,
  listings,
  buttonLabel,
  buttonClassName,
  transaction,
}: DummyTransactionDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<DummyTransactionDraft>(buildDraft(listings, transaction));

  const isEditMode = Boolean(transaction?.id);
  const listingOptions = listings.map((listing) => ({
    id: String(listing.id),
    title: listing.product_name,
  }));
  const selectedListing =
    listings.find((listing) => String(listing.id) === form.matched_listing_id) ?? null;
  const availableStyles = selectedListing?.style_options?.filter(Boolean) ?? [];

  useEffect(() => {
    if (!isOpen) {
      setForm(buildDraft(listings, transaction));
      setError("");
    }
  }, [isOpen, listings, transaction]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving && !isDeleting) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDeleting, isOpen, isSaving]);

  function updateField<Key extends keyof DummyTransactionDraft>(
    key: Key,
    value: DummyTransactionDraft[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleListingChange(nextListingId: string) {
    const matchedListing = listingOptions.find((listing) => listing.id === nextListingId);
    const matchedListingRecord = listings.find((listing) => String(listing.id) === nextListingId);
    const nextStyle =
      matchedListingRecord?.style_options && matchedListingRecord.style_options.length > 0
        ? matchedListingRecord.style_options.includes(form.style)
          ? form.style
          : matchedListingRecord.style_options[0] ?? ""
        : form.style;
    const nextCost = resolveListingProductCost(matchedListingRecord, nextStyle);

    setForm((current) => ({
      ...current,
      matched_listing_id: nextListingId,
      listing_title: matchedListing ? matchedListing.title : current.listing_title,
      style: nextStyle,
      product_cost_snapshot_usd: nextCost != null ? String(nextCost) : current.product_cost_snapshot_usd,
    }));
  }

  function handleStyleChange(nextStyle: string) {
    const matchedListingRecord = listings.find(
      (listing) => String(listing.id) === form.matched_listing_id,
    );
    const nextCost = resolveListingProductCost(matchedListingRecord, nextStyle);

    setForm((current) => ({
      ...current,
      style: nextStyle,
      product_cost_snapshot_usd: nextCost != null ? String(nextCost) : current.product_cost_snapshot_usd,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const endpoint = isEditMode
      ? `/api/stores/${storeId}/transactions/${transaction?.id}`
      : `/api/stores/${storeId}/transactions/dummy`;
    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matched_listing_id: form.matched_listing_id ? Number(form.matched_listing_id) : null,
          listing_title: form.listing_title,
          style: form.style || null,
          transaction_id: form.transaction_id,
          quantity: Number(form.quantity),
          subtotal_usd: Number(form.subtotal_usd),
          product_cost_snapshot_usd: parseOptionalNumber(form.product_cost_snapshot_usd),
          supplier_shipping_cost_usd: parseOptionalNumber(form.supplier_shipping_cost_usd),
          estimated_fees_usd: parseOptionalNumber(form.estimated_fees_usd),
          extra_cost_usd: parseOptionalNumber(form.extra_cost_usd),
          event_date: form.event_date || null,
          review_notes: form.review_notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            isEditMode
              ? "Unable to update the transaction."
              : "Unable to create the dummy transaction.",
          ),
        );
      }

      publishFlash({
        kind: "success",
        title: isEditMode
          ? "Transaction updated successfully."
          : "Dummy transaction added successfully.",
        body: isEditMode
          ? "The sales ledger and financial overview now reflect the latest cost inputs."
          : "The store workspace just picked up a new local sales row for testing the Gmail-first flow.",
      });
      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (caughtError) {
      setError(
        getMutationErrorMessage(
          caughtError,
          "Something went wrong while saving the transaction.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!transaction?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this dummy transaction from the store workspace?",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/stores/${storeId}/transactions/${transaction.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, "Unable to delete the dummy transaction."),
        );
      }

      publishFlash({
        kind: "success",
        title: "Transaction deleted successfully.",
        body: "The dummy sales row was removed from the ledger and local workspace data.",
      });
      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (caughtError) {
      setError(
        getMutationErrorMessage(
          caughtError,
          "Something went wrong while deleting the transaction.",
        ),
      );
    } finally {
      setIsDeleting(false);
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
                <h3 className={styles.title}>
                  {isEditMode ? "Edit Dummy Transaction" : "Add Dummy Transaction"}
                </h3>
                <p className={styles.subtitle}>
                  Phase 0 lets you test the Gmail-first sales workflow manually before the real
                  Gmail sync is connected for this store.
                </p>
              </div>
              <button
                aria-label="Close dialog"
                className={styles.closeButton}
                disabled={isSaving || isDeleting}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                x
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`transaction-listing-${storeId}`}>
                    Matched Listing
                  </label>
                  <select
                    className={styles.control}
                    id={`transaction-listing-${storeId}`}
                    onChange={(event) => handleListingChange(event.target.value)}
                    value={form.matched_listing_id}
                  >
                    <option value="">Custom / Unmatched sale</option>
                    {listingOptions.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`transaction-style-${storeId}`}>
                    Style
                  </label>
                  {availableStyles.length > 0 ? (
                    <select
                      className={styles.control}
                      id={`transaction-style-${storeId}`}
                      onChange={(event) => handleStyleChange(event.target.value)}
                      value={form.style}
                    >
                      {availableStyles.map((styleOption) => (
                        <option key={styleOption} value={styleOption}>
                          {styleOption}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={styles.control}
                      id={`transaction-style-${storeId}`}
                      onChange={(event) => handleStyleChange(event.target.value)}
                      placeholder="A, B, C..."
                      value={form.style}
                    />
                  )}
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor={`transaction-title-${storeId}`}>
                    Listing Title
                  </label>
                  <input
                    className={styles.control}
                    id={`transaction-title-${storeId}`}
                    onChange={(event) => updateField("listing_title", event.target.value)}
                    required
                    value={form.listing_title}
                  />
                  <div className={styles.hint}>
                    This mirrors the Gmail-first title snapshot the future parser will bring in from
                    Etsy transaction emails.
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`transaction-id-${storeId}`}>
                    Transaction ID
                  </label>
                  <input
                    className={styles.control}
                    id={`transaction-id-${storeId}`}
                    onChange={(event) => updateField("transaction_id", event.target.value)}
                    required
                    value={form.transaction_id}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`transaction-date-${storeId}`}>
                    Event Date
                  </label>
                  <input
                    className={styles.control}
                    id={`transaction-date-${storeId}`}
                    onChange={(event) => updateField("event_date", event.target.value)}
                    type="date"
                    value={form.event_date}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`transaction-quantity-${storeId}`}>
                    Quantity
                  </label>
                  <input
                    className={styles.control}
                    id={`transaction-quantity-${storeId}`}
                    min="1"
                    onChange={(event) => updateField("quantity", event.target.value)}
                    required
                    type="number"
                    value={form.quantity}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`transaction-subtotal-${storeId}`}>
                    Subtotal (USD)
                  </label>
                  <input
                    className={styles.control}
                    id={`transaction-subtotal-${storeId}`}
                    min="0"
                    onChange={(event) => updateField("subtotal_usd", event.target.value)}
                    required
                    step="0.01"
                    type="number"
                    value={form.subtotal_usd}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`transaction-product-cost-${storeId}`}>
                    Product Cost (USD)
                  </label>
                  <input
                    className={styles.control}
                    id={`transaction-product-cost-${storeId}`}
                    min="0"
                    onChange={(event) => updateField("product_cost_snapshot_usd", event.target.value)}
                    placeholder="Optional for Phase 0"
                    step="0.01"
                    type="number"
                    value={form.product_cost_snapshot_usd}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`transaction-shipping-${storeId}`}>
                    Supplier Shipping (USD)
                  </label>
                  <input
                    className={styles.control}
                    id={`transaction-shipping-${storeId}`}
                    min="0"
                    onChange={(event) => updateField("supplier_shipping_cost_usd", event.target.value)}
                    placeholder="Required to complete the cost view"
                    required
                    step="0.01"
                    type="number"
                    value={form.supplier_shipping_cost_usd}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`transaction-fees-${storeId}`}>
                    Estimated Fees (USD)
                  </label>
                  <input
                    className={styles.control}
                    id={`transaction-fees-${storeId}`}
                    min="0"
                    onChange={(event) => updateField("estimated_fees_usd", event.target.value)}
                    step="0.01"
                    type="number"
                    value={form.estimated_fees_usd}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`transaction-extra-cost-${storeId}`}>
                    Extra Cost (USD)
                  </label>
                  <input
                    className={styles.control}
                    id={`transaction-extra-cost-${storeId}`}
                    min="0"
                    onChange={(event) => updateField("extra_cost_usd", event.target.value)}
                    step="0.01"
                    type="number"
                    value={form.extra_cost_usd}
                  />
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor={`transaction-notes-${storeId}`}>
                    Review Notes
                  </label>
                  <textarea
                    className={`${styles.control} ${styles.textarea}`}
                    id={`transaction-notes-${storeId}`}
                    onChange={(event) => updateField("review_notes", event.target.value)}
                    placeholder="Optional context for testing costs, matching, or future Gmail import rules."
                    value={form.review_notes}
                  />
                </div>
              </div>

              {error && (
                <div className={styles.error}>
                  <strong className={styles.messageTitle}>Could not save transaction</strong>
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.footer}>
                <button
                  className={styles.secondaryAction}
                  disabled={isSaving || isDeleting}
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                {isEditMode && (
                  <button
                    className={styles.dangerAction}
                    disabled={isSaving || isDeleting}
                    onClick={handleDelete}
                    type="button"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}
                <button
                  className={styles.primaryAction}
                  disabled={isSaving || isDeleting}
                  type="submit"
                >
                  {isSaving
                    ? isEditMode
                      ? "Saving..."
                      : "Creating..."
                    : isEditMode
                      ? "Save Transaction"
                      : "Create Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
