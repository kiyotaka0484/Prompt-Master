import { motion } from "motion/react";

export function LandingAnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10 select-none">
      {/* Background dark gradient base */}
      <div className="absolute inset-0 bg-background" />

      {/* Radial soft glow top center */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 h-[750px] w-[1100px] rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_22%,transparent)_0%,color-mix(in_oklch,var(--accent-violet)_12%,transparent)_45%,transparent_70%)] blur-[100px]" />

      {/* Floating ambient orb 1 */}
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -35, 25, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 -left-28 h-96 w-96 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--accent-violet)_25%,transparent)_0%,transparent_70%)] blur-[80px]"
      />

      {/* Floating ambient orb 2 */}
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/3 -right-28 h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--accent-rose)_18%,transparent)_0%,transparent_70%)] blur-[90px]"
      />

      {/* Subtle tech grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 20%, #000 60%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 20%, #000 60%, transparent 100%)",
        }}
      />
    </div>
  );
}
