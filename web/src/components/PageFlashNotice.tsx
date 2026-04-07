"use client";

import { useEffect, useState } from "react";

import styles from "./page-flash-notice.module.css";
import {
  FLASH_EVENT_NAME,
  consumeFlash,
} from "@/lib/sellora";

type FlashNoticeState = {
  kind: "success" | "error";
  title: string;
  body?: string;
} | null;

export function PageFlashNotice() {
  const [notice, setNotice] = useState<FlashNoticeState>(null);

  useEffect(() => {
    const syncNotice = () => {
      setNotice(consumeFlash());
    };

    syncNotice();
    window.addEventListener(FLASH_EVENT_NAME, syncNotice);

    return () => window.removeEventListener(FLASH_EVENT_NAME, syncNotice);
  }, []);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  if (!notice) {
    return null;
  }

  return (
    <div
      className={`${styles.notice} ${
        notice.kind === "success" ? styles.success : styles.error
      }`}
    >
      <div className={styles.copy}>
        <div className={styles.eyebrow}>
          {notice.kind === "success" ? "Saved" : "Action Needed"}
        </div>
        <div className={styles.title}>{notice.title}</div>
        {notice.body && <div className={styles.body}>{notice.body}</div>}
      </div>

      <button
        aria-label="Dismiss notice"
        className={styles.dismiss}
        onClick={() => setNotice(null)}
        type="button"
      >
        x
      </button>
    </div>
  );
}
