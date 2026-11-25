import { getTodaySnapshot } from "@/lib/snapshot";
import { SYMBOL } from "@/lib/ingest/prices";
import { ubHour } from "@/lib/time";
import { HourlyTable } from "@/components/HourlyTable";
import { PriceHeader, BiasBar, LevelsCard, Empty, TodayGuide } from "@/components/TodayCards";
import { getEvents, getNextHighEvent, getReactions } from "@/lib/events";
import { Countdown } from "@/components/Countdown";
import { ReactionRows } from "@/components/NewsList";
import { eventTitle } from "@/lib/data/calendarProvider";
import { getT, getViewer } from "@/lib/prefs.server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT();
  return { title: t("Өнөөдөр — XAU Analytics", "Today — XAU Analytics") };
}

export default async function TodayPage() {
  const v = await getViewer();
  const { t } = v;
  const now = new Date();
  const [snap, upcoming, next, reactions] = await Promise.all([
    getTodaySnapshot(SYMBOL, now),
    getEvents(now, new Date(now.getTime() + 24 * 36e5)),
    getNextHighEvent(now),
    getReactions(),
  ]);
  const highSoon = upcoming.filter((e) => e.impact === "HIGH").map((e) => ({ time: e.time, title: e.title, type: e.type }));
  return (
    <div className="space-y-4">
      <header className="border-b border-zinc-800 pb-4 sm:pb-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-300">{v.date(now)} · {v.zone}</p>
        <h1 className="page-title">{t("Өнөөдрийн зах зээлийн тойм", "Today's market overview")}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">{t("Алтны үнэ, зах зээлийн одоогийн тал, чухал мэдээ болон цагийн түүхэн статистикийг нэг дороос ойлгомжтой харна уу.", "See the gold price, current market side, important releases, and hourly historical statistics in one clear view.")}</p>
      </header>
      <TodayGuide v={v} />
      <PriceHeader price={snap.price} bias={snap.bias} v={v} />
      <BiasBar bias={snap.bias} v={v} />
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {snap.hourly ? (
            <div className="table-card">
              <div className="px-4 pt-4 sm:px-5 sm:pt-5">
                <h2 className="text-base font-semibold text-zinc-100">{t("Дараагийн 24 цагт статистик юу харуулж байна вэ?", "What does the next 24 hours' history show?")}</h2>
                <p className="mt-1 mb-2 max-w-prose text-xs leading-relaxed text-zinc-500">{t("Тухайн цагт өмнө нь үнэ аль зүгт илүү олон хөдөлснийг харуулна. Энэ нь баталгаатай таамаг биш; мөр бүрийн n нь хэдэн өдрийн дата ашигласныг илэрхийлнэ.", "Shows which direction price moved more often at that hour before. This is not a guaranteed forecast; n shows how many days of data were used for each row.")}</p>
              </div>
              <HourlyTable rows={snap.hourly} nowHour={ubHour(now)} events={highSoon} v={v} />
            </div>
          ) : <Empty title={t("Цагийн магадлал", "Hourly odds")} v={v} />}
        </div>
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-semibold text-zinc-100">{t("Дараагийн өндөр нөлөөтэй мэдээ", "Next high-impact release")}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{t("Ийм мэдээ гарах үед алтны үнэ хурдан өөрчлөгдөж болдог. Доорх тоо нь өмнөх ижил мэдээнүүдийн дараах дундаж хөдөлгөөн юм.", "Gold can move quickly around these releases. The figures below show the average move after similar releases in the past.")}</p>
            {next ? (
              <>
                <div className="mt-4 font-medium">{eventTitle(next, t)}</div>
                <div className="text-sm text-zinc-400">{v.dateTime(next.time)} ({v.zone})</div>
                <div className="my-3 text-3xl font-semibold tracking-tight"><Countdown to={next.time.toISOString()} /></div>
                <p className="mb-1 text-xs text-zinc-500">{t("Өмнө нь ийм мэдээний дараа:", "After this kind of release before:")}</p>
                <ReactionRows stats={reactions.get(next.type)} v={v} />
              </>
            ) : <p className="text-zinc-500">{t("Бүртгэгдсэн чухал мэдээ алга", "No important releases on record")}</p>}
          </div>
          <LevelsCard levels={snap.levels} v={v} />
        </div>
      </div>
    </div>
  );
}
