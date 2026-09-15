import Image from "next/image";
import { Product } from "@/lib/data";

export function ProductPack({ product, compact = false, className = "" }: { product: Product; compact?: boolean; className?: string }) {
  return (
    <div className={`relative w-full max-w-full overflow-hidden rounded-[8px] border border-white/70 bg-[linear-gradient(145deg,#fff8ea,#ffffff)] shadow-card ${compact ? "aspect-[4/3]" : "aspect-square"} ${className}`}>
      <Image
        src={product.image}
        alt={`${product.name} WheatRaja fresh atta pack`}
        fill
        sizes={compact ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 100vw, 50vw"}
        className="object-cover transition duration-700 group-hover:scale-105"
        priority={!compact}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_45%,rgba(22,19,15,.34))]" />
      <div className="absolute left-4 top-4 rounded-full bg-white/88 px-3 py-1 text-xs font-black uppercase tracking-[.14em] text-forest shadow-sm backdrop-blur">
        Fresh Pack
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-[8px] border border-white/50 bg-white/82 p-3 shadow-sm backdrop-blur-md">
        <p className="text-sm font-black text-forest">{product.name}</p>
        <p className="mt-1 text-xs font-semibold text-mitti/65">1 KG / 5 KG / 10 KG variants</p>
      </div>
    </div>
  );
}
