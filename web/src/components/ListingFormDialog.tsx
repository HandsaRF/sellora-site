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
  description: string;
  title_aliases: string;
  tags: string;
  style_options: string[];
  supplier_link: string;
  supplier_notes: string;
  base_product_cost_usd: string;
  style_cost_overrides: string;
  expected_profit_target_usd: string;
  expected_margin_target_pct: string;
  extra_cost_usd: string;
};

function listToTextarea(value?: string[] | null) {
  return value?.join("\n") ?? "";
}

function overridesToTextarea(value?: Record<string, number> | null) {
  if (!value) {
    return "";
  }

  return Object.entries(value)
    .map(([style, price]) => `${style}=${price}`)
    .join("\n");
}

function buildListingDraft(listing?: ListingRecord): ListingDraft {
  return {
    product_name: listing?.product_name ?? "",
    status: listing?.status ?? LISTING_STATUS_OPTIONS[0],
    upload_date: listing?.upload_date ?? "",
    sku: listing?.sku ?? "",
    description: listing?.description ?? "",
    title_aliases: listToTextarea(listing?.title_aliases),
    tags: listToTextarea(listing?.tags),
    style_options:
      listing?.style_options && listing.style_options.length > 0
        ? [...listing.style_options]
        : [""],
    supplier_link: listing?.supplier_link ?? "",
    supplier_notes: listing?.supplier_notes ?? "",
    base_product_cost_usd:
      listing?.base_product_cost_usd != null ? String(listing.base_product_cost_usd) : "",
    style_cost_overrides: overridesToTextarea(listing?.style_cost_overrides),
    expected_profit_target_usd:
      listing?.expected_profit_target_usd != null
        ? String(listing.expected_profit_target_usd)
        : "",
    expected_margin_target_pct:
      listing?.expected_margin_target_pct != null
        ? String(listing.expected_margin_target_pct)
        : "",
    extra_cost_usd:
      listing?.extra_cost_usd != null ? String(listing.extra_cost_usd) : "",
  };
}

function parseStringList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return Number(trimmed);
}

function parseStyleOverrides(value: string) {
  const result: Record<string, number> = {};

  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const [style, amount] = trimmed.split("=");
    if (!style || amount === undefined) {
      continue;
    }

    const parsedAmount = Number(amount.trim());
    if (!Number.isFinite(parsedAmount)) {
      continue;
    }

    result[style.trim()] = parsedAmount;
  }

  return result;
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

  function updateStyleOption(index: number, value: string) {
    setForm((current) => ({
      ...current,
      style_options: current.style_options.map((style, styleIndex) =>
        styleIndex === index ? value : style,
      ),
    }));
  }

  function addStyleOption() {
    setForm((current) => ({
      ...current,
      style_options: [...current.style_options, ""],
    }));
  }

  function removeStyleOption(index: number) {
    setForm((current) => {
      const nextStyles = current.style_options.filter((_, styleIndex) => styleIndex !== index);

      return {
        ...current,
        style_options: nextStyles.length > 0 ? nextStyles : [""],
      };
    });
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
        body: JSON.stringify({
          product_name: form.product_name,
          status: form.status,
          upload_date: form.upload_date,
          sku: form.sku,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            isEditMode ? "Unable to update listing." : "Unable to create listing.",
          ),
        );
      }

      const savedListing = (await response.json()) as ListingRecord;
      const profileResponse = await fetch(
        `/api/stores/${storeId}/listings/${savedListing.id}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: form.description,
            title_aliases: parseStringList(form.title_aliases),
            tags: parseStringList(form.tags),
            style_options: form.style_options.map((style) => style.trim()).filter(Boolean),
            supplier_link: form.supplier_link,
            supplier_notes: form.supplier_notes,
            base_product_cost_usd: parseOptionalNumber(form.base_product_cost_usd),
            style_cost_overrides: parseStyleOverrides(form.style_cost_overrides),
            expected_profit_target_usd: parseOptionalNumber(form.expected_profit_target_usd),
            expected_margin_target_pct: parseOptionalNumber(form.expected_margin_target_pct),
            extra_cost_usd: parseOptionalNumber(form.extra_cost_usd),
          }),
        },
      );

      if (!profileResponse.ok) {
        throw new Error(
          await readApiErrorMessage(
            profileResponse,
            "The listing basics were saved, but the local sourcing profile could not be updated.",
          ),
        );
      }

      publishFlash({
        kind: "success",
        title: isEditMode ? "Listing updated successfully." : "Listing created successfully.",
        body: isEditMode
          ? "The listing details and sourcing profile now live together inside this store workspace."
          : "The new listing now includes its first sourcing and cost profile for the sales workflow.",
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
          <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
            <div className={styles.header}>
              <div className={styles.heading}>
                <h3 className={styles.title}>
                  {isEditMode ? "Edit Listing" : "Add Listing"}
                </h3>
                <p className={styles.subtitle}>
                  The listing editor now starts moving toward the real split you described:
                  listing details on one side, sourcing and cost on the other.
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
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Listing Details</div>
                <div className={styles.sectionHint}>
                  Etsy-facing content, matching helpers, and the product identity for this store.
                </div>

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
                    <label className={styles.label} htmlFor={`listing-description-${storeId}`}>
                      Description
                    </label>
                    <textarea
                      className={`${styles.control} ${styles.textarea}`}
                      id={`listing-description-${storeId}`}
                      onChange={(event) => updateField("description", event.target.value)}
                      placeholder="Short local description or Etsy copy notes."
                      value={form.description}
                    />
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor={`listing-aliases-${storeId}`}>
                      Title Aliases
                    </label>
                    <textarea
                      className={`${styles.control} ${styles.textarea}`}
                      id={`listing-aliases-${storeId}`}
                      onChange={(event) => updateField("title_aliases", event.target.value)}
                      placeholder={"One alias per line\nOld Etsy title\nCommon Gmail title variation"}
                      value={form.title_aliases}
                    />
                    <div className={styles.hint}>
                      These aliases are for future Gmail title matching, especially if Etsy titles change over time.
                    </div>
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor={`listing-tags-${storeId}`}>
                      Tags
                    </label>
                    <textarea
                      className={`${styles.control} ${styles.textarea}`}
                      id={`listing-tags-${storeId}`}
                      onChange={(event) => updateField("tags", event.target.value)}
                      placeholder={"One tag per line\nbuilding blocks\nbar decor"}
                      value={form.tags}
                    />
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor={`listing-styles-${storeId}`}>
                      Style Options
                    </label>
                    <div className={styles.dynamicList}>
                      {form.style_options.map((styleOption, index) => (
                        <div key={`style-option-${index}`} className={styles.dynamicRow}>
                          <input
                            className={styles.control}
                            id={index === 0 ? `listing-styles-${storeId}` : undefined}
                            onChange={(event) => updateStyleOption(index, event.target.value)}
                            placeholder={`Style ${index + 1} (A, B, C...)`}
                            value={styleOption}
                          />
                          <button
                            className={styles.rowActionDanger}
                            onClick={() => removeStyleOption(index)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                      <button
                        className={styles.rowAction}
                        onClick={addStyleOption}
                        type="button"
                      >
                        Add Style
                      </button>
                    </div>
                    <div className={styles.hint}>
                      Add each style as its own option. The dummy sales flow can then use these saved styles directly.
                    </div>
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
              </div>

              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeading}>Sourcing &amp; Cost</div>
                <div className={styles.sectionHint}>
                  This is the internal side of the listing: EPROLO link, cost profile, and the values dummy sales can auto-fill.
                </div>

                <div className={styles.grid}>
                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor={`listing-supplier-link-${storeId}`}>
                      EPROLO Product Link
                    </label>
                    <input
                      className={styles.control}
                      id={`listing-supplier-link-${storeId}`}
                      onChange={(event) => updateField("supplier_link", event.target.value)}
                      placeholder="https://eprolo.com/..."
                      value={form.supplier_link}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`listing-base-cost-${storeId}`}>
                      Base Product Cost (USD)
                    </label>
                    <input
                      className={styles.control}
                      id={`listing-base-cost-${storeId}`}
                      min="0"
                      onChange={(event) => updateField("base_product_cost_usd", event.target.value)}
                      step="0.01"
                      type="number"
                      value={form.base_product_cost_usd}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`listing-extra-cost-${storeId}`}>
                      Extra Cost (USD)
                    </label>
                    <input
                      className={styles.control}
                      id={`listing-extra-cost-${storeId}`}
                      min="0"
                      onChange={(event) => updateField("extra_cost_usd", event.target.value)}
                      step="0.01"
                      type="number"
                      value={form.extra_cost_usd}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`listing-profit-target-${storeId}`}>
                      Expected Profit Target (USD)
                    </label>
                    <input
                      className={styles.control}
                      id={`listing-profit-target-${storeId}`}
                      min="0"
                      onChange={(event) => updateField("expected_profit_target_usd", event.target.value)}
                      step="0.01"
                      type="number"
                      value={form.expected_profit_target_usd}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`listing-margin-target-${storeId}`}>
                      Expected Margin Target (%)
                    </label>
                    <input
                      className={styles.control}
                      id={`listing-margin-target-${storeId}`}
                      min="0"
                      onChange={(event) => updateField("expected_margin_target_pct", event.target.value)}
                      step="0.01"
                      type="number"
                      value={form.expected_margin_target_pct}
                    />
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor={`listing-style-costs-${storeId}`}>
                      Style Cost Overrides
                    </label>
                    <textarea
                      className={`${styles.control} ${styles.textarea}`}
                      id={`listing-style-costs-${storeId}`}
                      onChange={(event) => updateField("style_cost_overrides", event.target.value)}
                      placeholder={"One style override per line\nA=12.99\nB=14.50"}
                      value={form.style_cost_overrides}
                    />
                    <div className={styles.hint}>
                      Use `Style=Price`. If no override is found, the sales workflow will fall back to the base product cost.
                    </div>
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor={`listing-supplier-notes-${storeId}`}>
                      Supplier Notes
                    </label>
                    <textarea
                      className={`${styles.control} ${styles.textarea}`}
                      id={`listing-supplier-notes-${storeId}`}
                      onChange={(event) => updateField("supplier_notes", event.target.value)}
                      placeholder="Anything important about shipping regions, sourcing, or the supplier workflow."
                      value={form.supplier_notes}
                    />
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
