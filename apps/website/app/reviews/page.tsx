import { PageShell } from "@/components/page-shell";
import { reviews } from "@/lib/data";
import { ShieldCheck, Star } from "lucide-react";

export default function ReviewsPage() {
  return (
    <PageShell eyebrow="Customer love" title="Loved by families who care about freshness.">
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
        {reviews.concat(reviews).map((review, index) => (
          <figure key={`${review.name}-${index}`} className="rounded-[8px] border border-mitti/10 bg-white p-6 shadow-card">
            <div className="flex gap-1 text-wheat">
              {Array.from({ length: 5 }).map((_, star) => <Star key={star} size={16} fill="currentColor" />)}
            </div>
            <blockquote className="mt-4 text-mitti/80">"{review.text}"</blockquote>
            <figcaption className="mt-5 flex items-center justify-between gap-3 font-semibold text-forest">
              <span>{review.name}</span>
              {review.verified ? <span className="inline-flex items-center gap-1 rounded-full bg-leaf/10 px-2 py-1 text-xs text-leaf"><ShieldCheck size={13} /> Verified</span> : null}
            </figcaption>
          </figure>
        ))}
      </section>
    </PageShell>
  );
}
