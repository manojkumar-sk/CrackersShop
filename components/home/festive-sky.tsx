const rayCount = 16;

const fireworks = [
  { top: "88px", left: "6%", delay: "0s", glow: "#ffd56a", spark: "#ffb703", travel: "78px", desktopOnly: true },
  { top: "150px", left: "94%", delay: "0.7s", glow: "#ff4f8b", spark: "#ff8fab", travel: "70px", desktopOnly: true },
  { top: "300px", left: "82%", delay: "0.35s", glow: "#ffd56a", spark: "#ff7a1a", travel: "76px", desktopOnly: false },
  { top: "360px", left: "18%", delay: "1s", glow: "#7ad7ff", spark: "#4cc9f0", travel: "68px", desktopOnly: false },
  { top: "410px", left: "90%", delay: "1.6s", glow: "#ff5d8f", spark: "#ffd60a", travel: "80px", desktopOnly: false },
  { top: "500px", left: "70%", delay: "2.2s", glow: "#ff6b35", spark: "#ffe66d", travel: "72px", desktopOnly: false },
  { top: "540px", left: "12%", delay: "1.3s", glow: "#c77dff", spark: "#ffd56a", travel: "74px", desktopOnly: false },
] as const;

const sparks = [
  { top: "270px", left: "28%", delay: "0.2s", angle: "20deg", glow: "#ffe08a" },
  { top: "310px", left: "62%", delay: "0.9s", angle: "140deg", glow: "#ff8fab" },
  { top: "360px", left: "18%", delay: "1.4s", angle: "250deg", glow: "#7ad7ff" },
  { top: "410px", left: "84%", delay: "0.5s", angle: "70deg", glow: "#ffb703" },
  { top: "450px", left: "36%", delay: "1.9s", angle: "300deg", glow: "#ff6b35" },
  { top: "240px", left: "72%", delay: "1.1s", angle: "190deg", glow: "#ffe66d" },
  { top: "500px", left: "10%", delay: "0.6s", angle: "40deg", glow: "#ff4f8b" },
  { top: "340px", left: "54%", delay: "2.1s", angle: "110deg", glow: "#4cc9f0" },
] as const;

export function FestiveSky() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden print:hidden" aria-hidden="true">
      {fireworks.map((burst) => (
        <div
          key={`${burst.top}-${burst.left}`}
          className={`firework ${burst.desktopOnly ? "hidden md:block" : ""}`}
          style={{ top: burst.top, left: burst.left, ["--glow" as string]: burst.glow }}
        >
          <span
            className="firework-core"
            style={{ ["--delay" as string]: burst.delay, ["--glow" as string]: burst.glow }}
          />
          {Array.from({ length: rayCount }, (_, index) => (
            <span
              key={index}
              className="firework-ray"
              style={{
                ["--delay" as string]: burst.delay,
                ["--angle" as string]: `${index * (360 / rayCount)}deg`,
                ["--travel" as string]: index % 2 === 0 ? burst.travel : "52px",
                ["--spark" as string]: index % 3 === 0 ? "#fff6d0" : burst.spark,
                ["--glow" as string]: burst.glow,
              }}
            />
          ))}
        </div>
      ))}
      {sparks.map((spark) => (
        <span
          key={`${spark.top}-${spark.left}`}
          className="firework-spark"
          style={{
            top: spark.top,
            left: spark.left,
            ["--delay" as string]: spark.delay,
            ["--angle" as string]: spark.angle,
            ["--glow" as string]: spark.glow,
          }}
        />
      ))}
    </div>
  );
}
