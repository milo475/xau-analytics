import type { TodaySnapshot } from "@/lib/snapshot";
import type { Timeframe } from "@/lib/analysis/indicators";
import { biasLabelText } from "@/lib/analysis/bias";
import type { T } from "@/lib/i18n";
import { MN_VIEWER, type Viewer } from "@/lib/viewer";

export const loadingText = (t: T) => t("Дата ачаалж байна", "Loading data");
const tfLabels = (t: T): [Timeframe, string][] => [["1day", t("Өдөр", "Day")], ["4h", t("4ц", "4h")], ["1h", t("1ц", "1h")], ["15min", t("15м", "15m")]];
const money = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Empty({ title, v = MN_VIEWER }: { title: string; v?: Viewer }) {
  return <div className="card"><h2 className="card-title">{title}</h2><p className="text-zinc-500">{loadingText(v.t)}</p></div>;
}

export function PriceHeader({ price, bias, v = MN_VIEWER }: Pick<TodaySnapshot, "price" | "bias"> & { v?: Viewer }) {
  const { t } = v;
  if (!price) return <Empty title="XAUUSD" v={v} />;
  const up = (price.changePct ?? 0) >= 0;
  const labelColor = bias?.label === "ӨСӨХ хандлага" ? "text-emerald-400" : bias?.label === "УНАХ хандлага" ? "text-red-400" : "text-zinc-300"; // i18n-ok: compared with the stored label
  return (
    <div className="card flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-zinc-400">{t("Одоогийн алтны үнэ · XAUUSD", "Current gold price · XAUUSD")}</div>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-mono text-4xl font-semibold tracking-tight sm:text-5xl">{money(price.last)}</span>
          {price.changePct !== null && <span className={up ? "text-emerald-400" : "text-red-400"}>{up ? "▲" : "▼"} {Math.abs(price.changePct).toFixed(2)}% <span className="text-xs text-zinc-500">{t("өнөөдөр", "today")}</span></span>}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {t("Сүүлд шинэчлэгдсэн", "Last updated")} {v.time(price.updatedAt)}
          {price.stale && <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300">{t("Хоцролттой", "Delayed")}</span>}
        </div>
      </div>
      {bias && <div className="sm:text-right"><div className="text-sm text-zinc-400">{t("Одоогийн давамгай тал", "Current dominant side")}</div><div className={`text-xl font-semibold sm:text-2xl ${labelColor}`}>{biasLabelText(bias.label, t)}</div><p className="mt-1 text-xs text-zinc-500">{t("Үнэ өснө, буурна гэсэн баталгаа биш", "Not a guarantee that price will rise or fall")}</p></div>}
    </div>
  );
}

export function BiasBar({ bias, v = MN_VIEWER }: Pick<TodaySnapshot, "bias"> & { v?: Viewer }) {
  const { t } = v;
  if (!bias) return <Empty title={t("Давамгай тал", "Dominant side")} v={v} />;
  return (
    <div className="card">
      <h2 className="text-base font-semibold text-zinc-100">{t("Зах зээл аль тал руу илүү хэлбийж байна вэ?", "Which side is the market leaning toward?")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{t("Ногоон хэсэг их байх тусам худалдан авагчдын хүч, улаан хэсэг их байх тусам худалдагчдын хүч илүү байгааг харуулна.", "More green suggests stronger buyer pressure; more red suggests stronger seller pressure.")}</p>
      <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="text-emerald-400">{t("Худалдан авагч", "Buyers")} {bias.buyerPct}%</span><span className="text-red-400">{t("Худалдагч", "Sellers")} {100 - bias.buyerPct}%</span></div>
      <div className="flex h-3 overflow-hidden rounded-full bg-red-500/70" role="img" aria-label={t(`Худалдан авагч ${bias.buyerPct}%`, `Buyers ${bias.buyerPct}%`)}>
        <div className="bg-emerald-500" style={{ width: `${bias.buyerPct}%` }} />
      </div>
      <div className="mt-4"><h3 className="mb-2 text-xs font-medium text-zinc-400">{t("Цагийн хүрээ тус бүрийн хүч", "Strength by timeframe")}</h3><div className="grid grid-cols-4 gap-2 text-sm sm:flex sm:flex-wrap">
        {tfLabels(t).map(([tf, label]) => {
          const s = bias.perTimeframe[tf];
          return (
            <span key={tf} className="flex flex-col items-center gap-0.5 rounded-lg border border-zinc-800 px-2 py-1.5 font-mono sm:flex-row sm:gap-1.5">
              <span className="text-xs text-zinc-400 sm:text-sm">{label}</span>
              {s === null || s === undefined ? <span className="text-zinc-500">—</span> : s >= 20 ? <span className="text-emerald-400">▲ {Math.round(s)}</span> : s <= -20 ? <span className="text-red-400">▼ {Math.round(s)}</span> : <span className="text-zinc-300">● {Math.round(s)}</span>}
            </span>
          );
        })}
      </div></div>
      <details className="mt-4 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
        <summary className="cursor-pointer font-medium text-zinc-400 hover:text-zinc-200">{t("Энэ тоог хэрхэн гаргадаг вэ?", "How is this calculated?")}</summary>
        <p className="mt-2 leading-relaxed">{t("Оноо −100…+100: тренд (EMA20/50/200), моментум (RSI, MACD), бүтэц (оргил/ёроол)-ийг нэгтгэдэг. Жин: өдөр 35%, 4ц 30%, 1ц 20%, 15м 15%.", "Score −100…+100 combines trend (EMA20/50/200), momentum (RSI, MACD), and structure (highs/lows). Weights: daily 35%, 4h 30%, 1h 20%, 15m 15%.")}</p>
      </details>
    </div>
  );
}

export function LevelsCard({ levels, v = MN_VIEWER }: Pick<TodaySnapshot, "levels"> & { v?: Viewer }) {
  const { t } = v;
  if (!levels) return <Empty title={t("Гол түвшин", "Key levels")} v={v} />;
  const items: [string, number | null][] = [["R2", levels.r2], ["R1", levels.r1], ["Pivot", levels.p], ["S1", levels.s1], ["S2", levels.s2], [t("Өчигдрийн оргил", "Yesterday's high"), levels.prevHigh], [t("Өчигдрийн ёроол", "Yesterday's low"), levels.prevLow], [t("Өдрийн ATR", "Daily ATR"), levels.atr]];
  return (
    <div className="card">
      <h2 className="text-base font-semibold text-zinc-100">{t("Анзаарах үнийн түвшнүүд", "Price levels to watch")}</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{t("R нь эсэргүүцэл, S нь дэмжлэг, Pivot нь өдрийн дундаж чиг баримжааны түвшин юм.", "R is resistance, S is support, and Pivot is the day's central reference level.")}</p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm min-[420px]:grid-cols-2 lg:grid-cols-1">
        {items.map(([k, val]) => <div key={k} className="flex items-baseline justify-between gap-2"><dt className="text-zinc-400">{k}</dt><dd className="font-mono">{val === null ? "—" : money(val)}</dd></div>)}
      </dl>
    </div>
  );
}

/** A plain-language reading order for someone opening the dashboard for the first time. */
export function TodayGuide({ v = MN_VIEWER }: { v?: Viewer }) {
  const { t } = v;
  const steps = [
    [t("1", "1"), t("Үнэ одоо хаана байна вэ?", "Where is price now?"), t("XAUUSD-ийн одоогийн үнэ болон өнөөдрийн өөрчлөлтийг эхлээд харна.", "Start with the current XAUUSD price and its change today.")],
    [t("2", "2"), t("Зах зээл аль талдаа байна вэ?", "Which side is stronger?"), t("Ногоон, улаан харьцаа нь хоёр талын одоогийн хүчийг товч харуулна.", "The green and red balance gives a quick view of the current pressure on each side.")],
    [t("3", "3"), t("Ямар цаг, мэдээ чухал вэ?", "Which times and releases matter?"), t("Цагийн статистик болон өндөр нөлөөтэй мэдээг дараа нь шалгана.", "Then review hourly history and high-impact releases.")],
  ];
  return (
    <section aria-labelledby="today-guide" className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 sm:p-5">
      <h2 id="today-guide" className="text-base font-semibold text-zinc-100">{t("Эндээс юу ойлгож болох вэ?", "How to read this page")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{t("Энэ дэлгэц нь шийдвэр заахгүй — өдрийн нөхцөл байдлыг баримтаар хурдан ойлгоход зориулагдсан.", "This screen does not tell you what to do — it helps you understand the day's conditions from the data.")}</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map(([number, title, description]) => (
          <li key={number} className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/15 text-xs font-semibold text-amber-300">{number}</span>
            <h3 className="mt-2 text-sm font-medium text-zinc-100">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
