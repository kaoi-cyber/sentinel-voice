import { UbotQuiz } from "@/components/ubot-quiz/UbotQuiz";
import { LearnTabs } from "@/components/learn/LearnTabs";

export const metadata = { title: "Crypto Safety Quiz — Sentinel Voice" };

export default function QuizPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <LearnTabs active="quiz" />
      <p className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-xl border border-violet/40 bg-violet/10 px-4 py-2 text-sm">
        <span className="font-semibold text-violet">Built with U-bot · U-topia</span>
        <span className="text-muted">— generated in U-bot&apos;s U-Code mode, then reviewed and integrated by our team.</span>
      </p>
      <div className="mt-4">
        <UbotQuiz />
      </div>
    </section>
  );
}
