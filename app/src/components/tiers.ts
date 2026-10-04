// DS relevance tiers (#155, #173): their order and how they are named in the UI.
import type { DsTier } from "../data/types";

export const TIERS: DsTier[] = ["application", "core", "supporting", "peripheral"];
export const TIER_LABEL: Record<DsTier, string> = { application: "DS application", core: "core foundation", supporting: "supporting", peripheral: "peripheral" };
