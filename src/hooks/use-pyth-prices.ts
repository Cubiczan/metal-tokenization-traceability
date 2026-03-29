import { useQuery } from "@tanstack/react-query";

// Pyth Hermes API — free, no API key needed
const HERMES_URL = "https://hermes.pyth.network/v2/updates/price/latest";

// Pyth price feed IDs for metals (mainnet, verified)
const FEED_IDS: Record<string, string> = {
  Gold: "765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2",
  Silver: "f2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e",
  Platinum: "4239a8116ddeea08e3c1e89f7bedbda3e84b4aeb038a3a6c37af3737afef0e0e",
  Palladium: "3f0b39a820e387cf82c1ed4aca91aa06b3e06e3e3acbfb42e0e18d59f46b633e",
};

export interface PythPrice {
  metal: string;
  price: number;
  confidence: number;
  publishTime: number;
  status: "trading" | "unknown";
}

async function fetchPythPrices(): Promise<PythPrice[]> {
  const ids = Object.values(FEED_IDS);
  const metalNames = Object.keys(FEED_IDS);

  const params = new URLSearchParams();
  ids.forEach((id) => params.append("ids[]", id));

  const res = await fetch(`${HERMES_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Pyth API error: ${res.status}`);

  const data = await res.json();

  if (!data.parsed || !Array.isArray(data.parsed)) {
    throw new Error("Invalid Pyth response format");
  }

  return data.parsed.map((item: any, idx: number) => {
    const priceData = item.price;
    const price = Number(priceData.price) * Math.pow(10, priceData.expo);
    const confidence = Number(priceData.conf) * Math.pow(10, priceData.expo);

    return {
      metal: metalNames[idx],
      price,
      confidence,
      publishTime: priceData.publish_time * 1000,
      status: price > 0 ? "trading" : "unknown",
    };
  });
}

export function usePythPrices() {
  return useQuery({
    queryKey: ["pyth-prices"],
    queryFn: fetchPythPrices,
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: 2,
  });
}
