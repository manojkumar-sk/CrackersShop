const particleCount = 20;

const fireworks = [
  {
    top: "76px",
    left: "11%",
    delay: "0s",
    dur: "3.2s",
    color: "#ffb703",
    glow: "#ffe08a",
    radius: 62,
    scale: 1.05,
    show: "all",
  },
  {
    top: "72px",
    left: "89%",
    delay: "1.15s",
    dur: "2.9s",
    color: "#ff4f8b",
    glow: "#ffb3d1",
    radius: 54,
    scale: 0.92,
    show: "all",
  },
  {
    top: "80px",
    left: "32%",
    delay: "2.05s",
    dur: "3.4s",
    color: "#ff7a1a",
    glow: "#ffd56a",
    radius: 48,
    scale: 0.82,
    show: "all",
  },
  {
    top: "74px",
    left: "70%",
    delay: "0.55s",
    dur: "3s",
    color: "#4cc9f0",
    glow: "#9be7ff",
    radius: 58,
    scale: 0.96,
    show: "all",
  },
  {
    top: "78px",
    left: "50%",
    delay: "2.7s",
    dur: "3.3s",
    color: "#c77dff",
    glow: "#e7c6ff",
    radius: 44,
    scale: 0.78,
    show: "md",
  },
  {
    top: "340px",
    left: "5%",
    delay: "1.6s",
    dur: "3.1s",
    color: "#ffe66d",
    glow: "#ff6b35",
    radius: 56,
    scale: 1,
    show: "xl",
  },
  {
    top: "400px",
    left: "95%",
    delay: "0.25s",
    dur: "2.8s",
    color: "#ff5d8f",
    glow: "#ffd60a",
    radius: 52,
    scale: 0.95,
    show: "xl",
  },
] as const;

const sparks = [
  { top: "28px", left: "6%", delay: "0.4s", x: "18px", y: "-14px", glow: "#ffe08a" },
  { top: "36px", left: "94%", delay: "1.2s", x: "-16px", y: "12px", glow: "#ff8fab" },
  { top: "88px", left: "22%", delay: "2.2s", x: "14px", y: "16px", glow: "#7ad7ff" },
  { top: "84px", left: "78%", delay: "0.8s", x: "-18px", y: "-10px", glow: "#ffb703" },
] as const;

const showClass = {
  all: "",
  md: "hidden md:block",
  xl: "hidden xl:block",
} as const;

function particleOffset(index: number, radius: number) {
  const angle = ((index * 360) / particleCount) * (Math.PI / 180);
  const distance = index % 2 === 0 ? radius : Math.round(radius * 0.68);

  return {
    x: `${Math.round(Math.cos(angle) * distance)}px`,
    y: `${Math.round(Math.sin(angle) * distance)}px`,
  };
}

export function FestiveSky() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden print:hidden" aria-hidden="true">
      {fireworks.map((burst) => (
        <div
          key={`${burst.top}-${burst.left}`}
          className={`firework ${showClass[burst.show]}`}
          style={{
            ["--burst-top" as string]: burst.top,
            ["--burst-left" as string]: burst.left,
            ["--scale" as string]: String(burst.scale),
            ["--glow" as string]: burst.glow,
          }}
        >
          <span
            className="firework-core"
            style={{
              ["--delay" as string]: burst.delay,
              ["--dur" as string]: burst.dur,
              ["--glow" as string]: burst.glow,
            }}
          />
          {Array.from({ length: particleCount }, (_, index) => {
            const offset = particleOffset(index, burst.radius);

            return (
              <span
                key={index}
                className="firework-particle"
                style={{
                  ["--delay" as string]: burst.delay,
                  ["--dur" as string]: burst.dur,
                  ["--x" as string]: offset.x,
                  ["--y" as string]: offset.y,
                  ["--spark" as string]: index % 4 === 0 ? "#fff6d0" : burst.color,
                  ["--glow" as string]: burst.glow,
                }}
              />
            );
          })}
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
            ["--x" as string]: spark.x,
            ["--y" as string]: spark.y,
            ["--glow" as string]: spark.glow,
          }}
        />
      ))}
    </div>
  );
}
