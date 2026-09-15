import { AttaFinderClient } from "@/components/atta-finder-client";

export const metadata = {
  title: "Atta Finder | WheatRaja",
  description: "Find the right WheatRaja atta pack and subscription cycle for your family.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#FAF7EF] pt-16">
      <AttaFinderClient />
    </main>
  );
}
