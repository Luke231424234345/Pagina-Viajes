import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import type { TripDay } from "../models/types.js";

dotenv.config();

const BATCH_SIZE = 3; // days per request

function batchPrompt(destination: string, startDay: number, endDay: number, interests: string[], pace: string, usedLocations: string[]) {
  const days = endDay - startDay + 1;
  const avoidClause = usedLocations.length > 0
    ? `\n5. NO repitas estos lugares ya visitados: ${usedLocations.join(", ")}.`
    : "";
  return `Eres un experto planificador de viajes. Genera un itinerario REAL y detallado para los días ${startDay} al ${endDay} de un viaje a ${destination}.
Intereses: ${interests.join(", ") || "general"}. Ritmo: ${pace}.

REGLAS:
1. Lugares REALES con nombres específicos (ej. "Museo del Prado", no "un museo").
2. Coordenadas geográficas EXACTAS para cada lugar.
3. Responde SOLO con JSON válido, sin texto extra.
4. Exactamente ${days} día(s), numerados del ${startDay} al ${endDay}.${avoidClause}

JSON:
{"itinerary":[{"dayNumber":${startDay},"activities":[{"startTime":"09:00","note":"descripción","locationName":"Lugar Real","lat":0.0,"lng":0.0,"order":1}]}]}`;
}

function parseItinerary(content: string): TripDay[] {
  const clean = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    // Try to extract JSON object from the text
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found in response");
    parsed = JSON.parse(match[0]);
  }

  const itineraryData = parsed.itinerary || (Array.isArray(parsed) ? parsed : null);
  if (!itineraryData || !Array.isArray(itineraryData)) {
    throw new Error("Invalid itinerary structure");
  }

  return itineraryData.map((day: any, idx: number) => ({
    id: `day-${day.dayNumber || idx + 1}-${Math.random().toString(36).substring(7)}`,
    tripId: "",
    dayNumber: day.dayNumber || idx + 1,
    activities: (day.activities || []).map((act: any, actIdx: number) => ({
      id: `act-${actIdx}-${Math.random().toString(36).substring(7)}`,
      startTime: act.startTime || "09:00",
      note: act.note || "Actividad sugerida",
      locationName: act.locationName || act.note || "Lugar desconocido",
      latitude: Number(act.lat) || 0,
      longitude: Number(act.lng) || 0,
      isLocked: false,
      order: act.order || actIdx + 1,
    })),
  }));
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateBatchedWithGroq(
  destination: string,
  duration: number,
  interests: string[],
  pace: string
): Promise<TripDay[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") throw new Error("GROQ_API_KEY not set");

  const client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
  const allDays: TripDay[] = [];
  const usedLocations: string[] = [];

  for (let start = 1; start <= duration; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, duration);
    console.log(`  [Groq] Generating days ${start}-${end} of ${duration}... (avoiding: ${usedLocations.length} places)`);

    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: batchPrompt(destination, start, end, interests, pace, usedLocations) }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error(`Empty response for days ${start}-${end}`);

    const days = parseItinerary(content);
    allDays.push(...days);

    // Collect locations used so far for the next batch
    days.forEach(day => day.activities.forEach(act => {
      if (act.locationName) usedLocations.push(act.locationName);
    }));

    if (end < duration) await sleep(1500);
  }

  return allDays;
}

async function generateBatchedWithGemini(
  destination: string,
  duration: number,
  interests: string[],
  pace: string
): Promise<TripDay[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const allDays: TripDay[] = [];
  const usedLocations: string[] = [];

  for (let start = 1; start <= duration; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, duration);
    console.log(`  [Gemini] Generating days ${start}-${end} of ${duration}... (avoiding: ${usedLocations.length} places)`);

    const result = await model.generateContent(batchPrompt(destination, start, end, interests, pace, usedLocations));
    const content = result.response.text();
    const days = parseItinerary(content);
    allDays.push(...days);

    days.forEach(day => day.activities.forEach(act => {
      if (act.locationName) usedLocations.push(act.locationName);
    }));

    if (end < duration) await sleep(2000);
  }

  return allDays;
}

export async function generateItinerary(
  destination: string,
  duration: number,
  interests: string[],
  pace: string
): Promise<TripDay[]> {
  const provider = process.env.AI_PROVIDER ?? "groq";
  console.log(`Generating ${duration}-day itinerary for ${destination} using ${provider} (batches of ${BATCH_SIZE})...`);

  if (provider === "gemini") {
    try {
      return await generateBatchedWithGemini(destination, duration, interests, pace);
    } catch (error: any) {
      console.error(`Gemini failed (${error?.status ?? error?.message}), falling back to Groq...`);
      try {
        return await generateBatchedWithGroq(destination, duration, interests, pace);
      } catch (groqError) {
        console.error("Groq also failed:", groqError);
        return generateMockItinerary(duration);
      }
    }
  }

  try {
    return await generateBatchedWithGroq(destination, duration, interests, pace);
  } catch (error) {
    console.error("Groq error:", error);
    return generateMockItinerary(duration);
  }
}

function generateMockItinerary(duration: number): TripDay[] {
  console.warn("Using fallback mock itinerary.");
  return Array.from({ length: duration }, (_, i) => ({
    id: `day-${i + 1}-mock`,
    tripId: "",
    dayNumber: i + 1,
    activities: [
      {
        id: `act-1-${i + 1}`,
        startTime: "09:00",
        note: "Visita guiada por el centro histórico y principales monumentos.",
        locationName: "Centro Histórico",
        latitude: 40.41678,
        longitude: -3.70379,
        isLocked: false,
        order: 1,
      },
      {
        id: `act-2-${i + 1}`,
        startTime: "14:00",
        note: "Almuerzo en restaurante local recomendado.",
        locationName: "Restaurante Local",
        latitude: 40.418,
        longitude: -3.705,
        isLocked: false,
        order: 2,
      },
    ],
  }));
}
