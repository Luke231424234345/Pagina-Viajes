import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import type { Trip, TripDay, Place } from "./models/types.js";
import { generateItinerary } from "./services/aiService.js";

dotenv.config();

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// In-memory "database"
const trips: Trip[] = [];
const tripDays: Record<string, TripDay[]> = {};

app.get("/", (req, res) => {
  res.send("Travel Planner API is running!");
});

// Create a new trip and generate itinerary
app.post("/api/trips", async (req, res) => {
  const { destination, duration, interests, pace } = req.body;
  console.log(`[POST /api/trips] Creating trip to ${destination} for ${duration} days...`);
  
  const tripId = Math.random().toString(36).substring(7);
  const newTrip: Trip = {
    id: tripId,
    userId: "user-1", // Mock user
    name: `Viaje a ${destination}`,
    destination,
    numberOfDays: parseInt(duration),
    status: "planned",
  };

  trips.push(newTrip);
  tripDays[tripId] = [];

  if (req.body.skipAI) {
    console.log(`[POST /api/trips] Skipping AI generation for trip ${tripId}.`);
    return res.status(201).json({ trip: newTrip, days: [] });
  }

  // Generate itinerary using AI service
  try {
    const days = await generateItinerary(destination, parseInt(duration), interests, pace);
    tripDays[tripId] = days;
    console.log(`[POST /api/trips] Itinerary generated successfully for trip ${tripId}.`);
    res.status(201).json({ trip: newTrip, days });
  } catch (error) {
    console.error(`[POST /api/trips] Error generating itinerary:`, error);
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

app.get("/api/trips", (req, res) => {
  console.log(`[GET /api/trips] Fetching all trips...`);
  res.json(trips);
});

app.get("/api/trips/:id", (req, res) => {
  console.log(`[GET /api/trips/${req.params.id}] Fetching trip details...`);
  const trip = trips.find(t => t.id === req.params.id);
  if (!trip) {
    console.warn(`[GET /api/trips/${req.params.id}] Trip not found.`);
    return res.status(404).send("Trip not found");
  }
  res.json({ trip, days: tripDays[trip.id] || [] });
});

// Classify location types using AI
app.post("/api/classify", async (req, res) => {
  const { locations, city } = req.body as { locations: string[]; city: string };
  if (!locations?.length) return res.status(400).json({ error: "No locations provided" });

  const TYPES = ["atracción", "restaurante", "hotel", "transporte", "compras"];

  const prompt = `Clasifica cada lugar de la lista según su tipo. Ciudad de contexto: ${city || "desconocida"}.
Tipos posibles: ${TYPES.join(", ")}.
Responde SOLO con JSON: {"results":[{"location":"nombre","type":"tipo"},...]}
No incluyas texto extra.

Lugares:
${locations.map((l, i) => `${i + 1}. ${l}`).join("\n")}`;

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("No API key");

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });

    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const clean = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? clean);

    const map: Record<string, string> = {};
    (parsed.results ?? []).forEach((r: any) => { map[r.location] = r.type; });
    res.json({ map });
  } catch (err) {
    console.error("Classify error:", err);
    // Fallback: return atracción for all
    const map: Record<string, string> = {};
    locations.forEach(l => { map[l] = "atracción"; });
    res.json({ map });
  }
});

// Add activity to a trip day
app.post("/api/trips/:id/days/:dayNumber/activities", (req, res) => {
  const { id, dayNumber } = req.params;
  const { locationName, startTime, note, latitude, longitude } = req.body;

  const days = tripDays[id];
  if (!days) return res.status(404).json({ error: "Trip not found" });

  const dayNum = parseInt(dayNumber);
  let day = days.find(d => d.dayNumber === dayNum);

  if (!day) {
    day = { id: `day-${dayNum}-${Math.random().toString(36).substring(7)}`, tripId: id, dayNumber: dayNum, activities: [] };
    days.push(day);
    days.sort((a, b) => a.dayNumber - b.dayNumber);
  }

  const newActivity = {
    id: `act-manual-${Math.random().toString(36).substring(7)}`,
    startTime: startTime || "09:00",
    note: note || "",
    locationName,
    latitude: Number(latitude) || 0,
    longitude: Number(longitude) || 0,
    isLocked: false,
    order: day.activities.length + 1,
  };

  (day.activities as any[]).push(newActivity);
  console.log(`[POST] Added activity "${locationName}" to trip ${id} day ${dayNum}`);
  res.status(201).json(newActivity);
});

// Reorganize trip activities between days
app.post("/api/trips/:id/reorganize", (req, res) => {
  const { id } = req.params;
  const { moves } = req.body as { moves: { activityId: string; dayNumber: number }[] };

  const days = tripDays[id];
  if (!days) return res.status(404).json({ error: "Trip not found" });

  for (const move of moves) {
    // Find and remove activity from its current day
    let activity: any = null;
    for (const day of days) {
      const idx = (day.activities as any[]).findIndex((a: any) => a.id === move.activityId);
      if (idx !== -1) {
        activity = (day.activities as any[]).splice(idx, 1)[0];
        break;
      }
    }
    if (!activity) continue;

    // Find or create target day
    let targetDay = days.find((d) => d.dayNumber === move.dayNumber);
    if (!targetDay) {
      targetDay = {
        id: `day-${move.dayNumber}-${Math.random().toString(36).substring(7)}`,
        tripId: id,
        dayNumber: move.dayNumber,
        activities: [],
      };
      days.push(targetDay);
      days.sort((a, b) => a.dayNumber - b.dayNumber);
    }

    (targetDay.activities as any[]).push({ ...activity, order: targetDay.activities.length });
  }

  // Remove empty days
  tripDays[id] = days.filter((d) => d.activities.length > 0);

  console.log(`[POST /api/trips/${id}/reorganize] Moved ${moves.length} activities.`);
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});