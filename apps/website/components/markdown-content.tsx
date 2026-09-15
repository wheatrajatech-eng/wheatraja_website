import Image from "next/image";

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (match) {
          return <a key={index} href={match[2]} className="font-bold text-amber-800 underline underline-offset-4">{match[1]}</a>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function MarkdownContent({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        if (block.startsWith("# ")) return <h2 key={index} className="font-serif text-4xl leading-tight text-stone-950">{block.slice(2)}</h2>;
        if (block.startsWith("## ")) return <h3 key={index} className="font-serif text-3xl leading-tight text-stone-950">{block.slice(3)}</h3>;
        if (block.startsWith("### ")) return <h4 key={index} className="text-xl font-black text-stone-950">{block.slice(4)}</h4>;
        const image = block.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (image) {
          return (
            <div key={index} className="relative aspect-[16/9] overflow-hidden rounded-[24px]">
              <Image src={image[2]} alt={image[1]} fill sizes="(max-width: 1024px) 100vw, 760px" className="object-cover" />
            </div>
          );
        }
        if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6 text-lg leading-8 text-stone-700">
              {block.split("\n").map((line) => <li key={line}><InlineText text={line.trim().slice(2)} /></li>)}
            </ul>
          );
        }
        return <p key={index} className="text-lg leading-9 text-stone-700"><InlineText text={block} /></p>;
      })}
    </div>
  );
}
