const bursts = [
  { top: "8%", left: "10%", delay: "0s", dur: "4.8s", spark: "#ffd56a", sparkB: "#ff6a3d" },
  { top: "18%", left: "82%", delay: "1.3s", dur: "5.4s", spark: "#ff4f8b", sparkB: "#ffe08a" },
  { top: "36%", left: "24%", delay: "2.4s", dur: "5s", spark: "#7ec8ff", sparkB: "#ffd56a" },
  { top: "48%", left: "70%", delay: "0.7s", dur: "5.6s", spark: "#ffb03a", sparkB: "#ff4d6a" },
  { top: "62%", left: "14%", delay: "3.1s", dur: "4.9s", spark: "#ffe08a", sparkB: "#ff7a3c" },
  { top: "74%", left: "86%", delay: "1.9s", dur: "5.2s", spark: "#d07bff", sparkB: "#ffd56a" },
] as const;

const twinkles = [
  { top: "6%", left: "28%", delay: "0.2s" },
  { top: "11%", left: "64%", delay: "1.1s" },
  { top: "16%", left: "46%", delay: "0.6s" },
  { top: "27%", left: "12%", delay: "1.8s" },
  { top: "31%", left: "90%", delay: "0.4s" },
  { top: "42%", left: "54%", delay: "2.2s" },
  { top: "55%", left: "38%", delay: "1.4s" },
  { top: "67%", left: "76%", delay: "0.8s" },
  { top: "78%", left: "22%", delay: "2.6s" },
  { top: "84%", left: "58%", delay: "1.6s" },
] as const;

const glows = [
  { top: "4%", left: "-2%", delay: "0s", spark: "rgb(255 186 64 / 0.55)" },
  { top: "20%", left: "78%", delay: "1.6s", spark: "rgb(255 84 140 / 0.4)" },
  { top: "46%", left: "8%", delay: "2.8s", spark: "rgb(120 90 255 / 0.35)" },
] as const;

export function FestiveSky() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden print:hidden" aria-hidden="true">
      {glows.map((glow) => (
        <span
          key={`${glow.top}-${glow.left}`}
          className="cracker-glow"
          style={{
            top: glow.top,
            left: glow.left,
            ["--delay" as string]: glow.delay,
            ["--spark" as string]: glow.spark,
          }}
        />
      ))}
      {bursts.map((burst) => (
        <span
          key={`${burst.top}-${burst.left}`}
          className="cracker-burst"
          style={{
            top: burst.top,
            left: burst.left,
            ["--delay" as string]: burst.delay,
            ["--dur" as string]: burst.dur,
            ["--spark" as string]: burst.spark,
            ["--spark-b" as string]: burst.sparkB,
          }}
        />
      ))}
      {twinkles.map((star) => (
        <span
          key={`${star.top}-${star.left}`}
          className="cracker-twinkle"
          style={{
            top: star.top,
            left: star.left,
            ["--delay" as string]: star.delay,
          }}
        />
      ))}
    </div>
  );
}
