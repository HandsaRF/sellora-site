import { CSSProperties } from "react";

import styles from "./StatusBadge.module.css";
import {
  getGmailStatusAppearance,
  getListingStatusAppearance,
  getStoreStatusAppearance,
  getTransactionStatusAppearance,
} from "@/lib/sellora";

type StatusBadgeProps = {
  status: string;
  category: "store" | "listing" | "transaction" | "gmail";
  size?: "default" | "compact";
  className?: string;
};

type StatusStyle = CSSProperties & {
  "--status-background": string;
  "--status-border": string;
  "--status-text": string;
  "--status-dot": string;
  "--status-glow": string;
  "--status-shadow": string;
};

export function StatusBadge({
  status,
  category,
  size = "default",
  className,
}: StatusBadgeProps) {
  const appearance =
    category === "store"
      ? getStoreStatusAppearance(status)
      : category === "listing"
        ? getListingStatusAppearance(status)
        : category === "transaction"
          ? getTransactionStatusAppearance(status)
          : getGmailStatusAppearance(status);

  const style: StatusStyle = {
    "--status-background": appearance.background,
    "--status-border": appearance.border,
    "--status-text": appearance.text,
    "--status-dot": appearance.dot,
    "--status-glow": appearance.glow,
    "--status-shadow": appearance.shadow,
  };

  return (
    <span
      className={[
        styles.badge,
        size === "compact" ? styles.compact : "",
        appearance.pulse ? styles.pulse : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <span className={styles.dot} />
      <span className={styles.label}>{status}</span>
    </span>
  );
}
