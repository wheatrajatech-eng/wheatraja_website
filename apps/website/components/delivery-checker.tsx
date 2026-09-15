"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type DeliveryResult = { deliverable: boolean; charge: number | null; eta: string; distance_km: number };

export function DeliveryChecker() {
  const [pincode, setPincode] = useState("201301");
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/delivery/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode, address })
      });
      setResult(await response.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[18px] bg-white p-7 shadow-card">
      <div className="grid gap-3 md:grid-cols-[.5fr_1fr_auto]">
        <input value={pincode} onChange={(e) => setPincode(e.target.value)} className="rounded-full border border-mitti/15 px-4 py-3" placeholder="Pincode" />
        <input value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-full border border-mitti/15 px-4 py-3" placeholder="Society / sector / address" />
        <button onClick={check} className="rounded-full bg-forest px-6 py-3 font-bold text-cream">{loading ? "Checking..." : "Check"}</button>
      </div>
      {result ? (
        <div className={`mt-4 rounded-[14px] p-4 font-semibold ${result.deliverable ? "bg-leaf/10 text-leaf" : "bg-red-50 text-red-700"}`}>
          {result.deliverable ? `Deliverable · ${result.charge ? `${formatPrice(result.charge)} delivery` : "Free delivery"} · ${result.eta}` : `Not deliverable · ${result.eta}`}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-mitti/65">Enter your pincode or sector to see fee, ETA and serviceability.</p>
      )}
    </div>
  );
}
