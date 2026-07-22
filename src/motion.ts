import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

/**
 * Single signature ease shared across the app so entrance/hover motion feels consistent.
 * Expo-out style curve — quick start, soft settle. (MOTION_INTENSITY: 3 — subtle, no bounce.)
 */
export const VPH_EASE = "vphEase";

// Module is a singleton, so this registers exactly once.
CustomEase.create(VPH_EASE, "M0,0 C0.16,1 0.3,1 1,1");

export { gsap };
