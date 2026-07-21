import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { onMounted, onUnmounted } from "vue";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

function tick(time: number) {
  lenis?.raf(time * 1000);
}

export function useLenisScroll(reducedMotion: () => boolean) {
  onMounted(() => {
    if (reducedMotion()) {
      // Reduced motion: skip smooth-scroll interpolation, keep native scroll + ScrollTrigger only.
      ScrollTrigger.refresh();
      return;
    }

    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  });

  onUnmounted(() => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  });
}
