export const STORE_STATUS_OPTIONS = [
  "Not Started",
  "In Progress",
  "Running",
  "Blocked",
  "Paused",
] as const;

export const LISTING_STATUS_OPTIONS = [
  "Draft",
  "Ready to Upload",
  "Uploaded",
  "Live",
  "Removed",
  "Blocked",
] as const;

export type StoreStatus = (typeof STORE_STATUS_OPTIONS)[number];
export type ListingStatus = (typeof LISTING_STATUS_OPTIONS)[number];

export type StoreRecord = {
  id: number;
  store_name: string;
  owner_name?: string | null;
  status: string;
  niche?: string | null;
  url?: string | null;
  logo_path?: string | null;
  banner_path?: string | null;
  notes?: string | null;
  total_listings?: number;
  live_listings?: number;
  updated_at?: string | null;
  created_at?: string | null;
};

export type ListingRecord = {
  id: number;
  product_name: string;
  status: string;
  upload_date?: string | null;
  sku?: string | null;
  main_image_path?: string | null;
};

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL =
  configuredApiBaseUrl && configuredApiBaseUrl.length > 0
    ? configuredApiBaseUrl
    : DEFAULT_API_BASE_URL;

type StatusAppearance = {
  background: string;
  border: string;
  text: string;
  dot: string;
  glow: string;
  shadow: string;
  pulse?: boolean;
};

type FlashNotice = {
  kind: "success" | "error";
  title: string;
  body?: string;
};

const DEFAULT_STATUS_APPEARANCE: StatusAppearance = {
  background: "linear-gradient(135deg, rgba(100, 116, 139, 0.16), rgba(30, 41, 59, 0.72))",
  border: "rgba(148, 163, 184, 0.18)",
  text: "#d4deee",
  dot: "#94a3b8",
  glow: "rgba(148, 163, 184, 0.32)",
  shadow: "rgba(15, 23, 42, 0.26)",
};

const STORE_STATUS_APPEARANCES: Record<string, StatusAppearance> = {
  "Not Started": {
    background: "linear-gradient(135deg, rgba(100, 116, 139, 0.12), rgba(15, 23, 42, 0.76))",
    border: "rgba(148, 163, 184, 0.18)",
    text: "#d9e4f3",
    dot: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.3)",
    shadow: "rgba(15, 23, 42, 0.24)",
  },
  "In Progress": {
    background: "linear-gradient(135deg, rgba(96, 165, 250, 0.18), rgba(30, 41, 59, 0.76))",
    border: "rgba(96, 165, 250, 0.24)",
    text: "#dcedff",
    dot: "#60a5fa",
    glow: "rgba(96, 165, 250, 0.38)",
    shadow: "rgba(37, 99, 235, 0.2)",
    pulse: true,
  },
  Running: {
    background: "linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(15, 23, 42, 0.78))",
    border: "rgba(52, 211, 153, 0.28)",
    text: "#defdf0",
    dot: "#34d399",
    glow: "rgba(52, 211, 153, 0.42)",
    shadow: "rgba(6, 95, 70, 0.24)",
    pulse: true,
  },
  Blocked: {
    background: "linear-gradient(135deg, rgba(248, 113, 113, 0.2), rgba(30, 10, 18, 0.72))",
    border: "rgba(248, 113, 113, 0.3)",
    text: "#ffe2e2",
    dot: "#f87171",
    glow: "rgba(248, 113, 113, 0.42)",
    shadow: "rgba(127, 29, 29, 0.2)",
  },
  Paused: {
    background: "linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(36, 24, 12, 0.76))",
    border: "rgba(245, 158, 11, 0.28)",
    text: "#fff0cf",
    dot: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.38)",
    shadow: "rgba(120, 53, 15, 0.2)",
  },
};

const LISTING_STATUS_APPEARANCES: Record<string, StatusAppearance> = {
  Draft: {
    background: "linear-gradient(135deg, rgba(100, 116, 139, 0.12), rgba(15, 23, 42, 0.76))",
    border: "rgba(148, 163, 184, 0.18)",
    text: "#d9e4f3",
    dot: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.28)",
    shadow: "rgba(15, 23, 42, 0.24)",
  },
  "Ready to Upload": {
    background: "linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(41, 28, 10, 0.78))",
    border: "rgba(250, 204, 21, 0.3)",
    text: "#fff5cc",
    dot: "#facc15",
    glow: "rgba(250, 204, 21, 0.4)",
    shadow: "rgba(133, 77, 14, 0.2)",
    pulse: true,
  },
  Uploaded: {
    background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 30, 46, 0.8))",
    border: "rgba(56, 189, 248, 0.28)",
    text: "#dff7ff",
    dot: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.38)",
    shadow: "rgba(3, 105, 161, 0.2)",
  },
  Live: {
    background: "linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(15, 23, 42, 0.78))",
    border: "rgba(52, 211, 153, 0.28)",
    text: "#defdf0",
    dot: "#34d399",
    glow: "rgba(52, 211, 153, 0.42)",
    shadow: "rgba(6, 95, 70, 0.24)",
    pulse: true,
  },
  Removed: {
    background: "linear-gradient(135deg, rgba(148, 163, 184, 0.14), rgba(30, 41, 59, 0.78))",
    border: "rgba(148, 163, 184, 0.18)",
    text: "#cbd5e1",
    dot: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.26)",
    shadow: "rgba(15, 23, 42, 0.18)",
  },
  Blocked: {
    background: "linear-gradient(135deg, rgba(248, 113, 113, 0.2), rgba(30, 10, 18, 0.72))",
    border: "rgba(248, 113, 113, 0.3)",
    text: "#ffe2e2",
    dot: "#f87171",
    glow: "rgba(248, 113, 113, 0.42)",
    shadow: "rgba(127, 29, 29, 0.2)",
  },
};

const FLASH_STORAGE_KEY = "sellora.flash";
export const FLASH_EVENT_NAME = "sellora:flash";

export function getApiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getStoreStatusAppearance(status: string) {
  return STORE_STATUS_APPEARANCES[status] ?? DEFAULT_STATUS_APPEARANCE;
}

export function getListingStatusAppearance(status: string) {
  return LISTING_STATUS_APPEARANCES[status] ?? DEFAULT_STATUS_APPEARANCE;
}

export function publishFlash(notice: FlashNotice) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify(notice));
  window.dispatchEvent(new CustomEvent(FLASH_EVENT_NAME));
}

export function consumeFlash() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(FLASH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(FLASH_STORAGE_KEY);

  try {
    return JSON.parse(raw) as FlashNotice;
  } catch {
    return null;
  }
}

export function getMutationErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (
    error instanceof TypeError ||
    (error instanceof Error && /failed to fetch/i.test(error.message))
  ) {
    return "Could not reach the local web API. Make sure the Sellora web services are running, then try again.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const body = await response.json();

    if (typeof body?.detail === "string" && body.detail.trim()) {
      return body.detail;
    }

    if (typeof body?.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}
