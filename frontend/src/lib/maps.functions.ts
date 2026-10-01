import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function gatewayHeaders() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) {
    throw new Error("Address lookup is not configured yet.");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
    "Content-Type": "application/json",
  };
}

async function readError(response: Response) {
  const body = await response.text();
  console.error(`Google Maps gateway failed [${response.status}]: ${body}`);
  if (response.status === 403) {
    throw new Error("Address lookup was denied. Check the Google Maps connection.");
  }
  throw new Error(`Address lookup failed (${response.status}).`);
}

/** Address autocomplete biased to the Greater Toronto Area. */
export const suggestAddresses = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        input: z.string().min(3).max(200),
        sessionToken: z.string().min(6).max(64),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const response = await fetch(`${GATEWAY}/places/v1/places:autocomplete`, {
      method: "POST",
      headers: {
        ...gatewayHeaders(),
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
      },
      body: JSON.stringify({
        input: data.input,
        sessionToken: data.sessionToken,
        includedRegionCodes: ["ca"],
        locationBias: {
          circle: { center: { latitude: 43.6532, longitude: -79.3832 }, radius: 50000 },
        },
      }),
    });
    if (!response.ok) await readError(response);
    const payload = (await response.json()) as {
      suggestions?: { placePrediction?: { placeId?: string; text?: { text?: string } } }[];
    };
    return (payload.suggestions ?? [])
      .slice(0, 5)
      .map((s) => ({
        placeId: s.placePrediction?.placeId ?? "",
        description: s.placePrediction?.text?.text ?? "",
      }))
      .filter((s) => s.placeId && s.description);
  });

/** Real driving distance and drive time between the two addresses. */
export const getRouteDistance = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        from: z.string().min(4).max(300),
        to: z.string().min(4).max(300),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const response = await fetch(`${GATEWAY}/routes/directions/v2:computeRoutes`, {
      method: "POST",
      headers: {
        ...gatewayHeaders(),
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: { address: data.from },
        destination: { address: data.to },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        regionCode: "CA",
      }),
    });
    if (!response.ok) await readError(response);
    const payload = (await response.json()) as {
      routes?: { distanceMeters?: number; duration?: string }[];
    };
    const route = payload.routes?.[0];
    if (!route?.distanceMeters) {
      return { distanceKm: null, driveMinutes: null };
    }
    const seconds = Number.parseInt(String(route.duration ?? "0").replace("s", ""), 10) || 0;
    return {
      distanceKm: Math.round((route.distanceMeters / 1000) * 10) / 10,
      driveMinutes: Math.round(seconds / 60),
    };
  });
