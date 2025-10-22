import { Router, Request, Response } from "express";
import { prisma } from "../db";
import OpenAI from "openai";

export const ingestRouter = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Define payload structure for type safety
interface Participant {
  name: string;
  email: string;
  role?: string | null;
}

interface IngestRequest {
  transcript_id: string;
  title: string;
  occurred_at: string;
  duration_minutes: number;
  participants?: Participant[];
  transcript: string;
  metadata?: Record<string, any>;
}

ingestRouter.post("/", async (req: Request<{}, {}, IngestRequest>, res: Response): Promise<void> => {
  try {
    const { transcript_id, title, occurred_at, duration_minutes, participants, transcript, metadata } = req.body;

    // Entity Extraction
    const extractionPrompt = `
    Extract the following from the transcript and return ONLY valid JSON:
    {
      "topics": [list of main discussion themes],
      "action_items": [list of tasks or follow-ups],
      "decisions": [list of key decisions],
      "sentiment": "positive" | "neutral" | "negative"
    }

    Transcript:
    ${transcript}
    `;

    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: extractionPrompt }],
    });

    let content = extractionResponse.choices[0].message?.content || "{}";
    content = content.replace(/```json|```/g, "").trim();

    let extracted: { topics?: string[]; action_items?: string[]; decisions?: string[]; sentiment?: string } = {};
    try {
      extracted = JSON.parse(content);
    } catch {
      console.error("Failed to parse JSON:", content);
    }

    // Check for existing transcript
    const existingTranscript = await prisma.transcript.findUnique({ where: { transcript_id } });
    if (existingTranscript) {
      res.status(200).json({ id: existingTranscript.id, status: "already_exists" });
      return;
    }

    // Create new transcript
    const newTranscript = await prisma.transcript.create({
      data: {
        transcript_id,
        title,
        occurred_at: new Date(occurred_at),
        duration_minutes,
        transcript,
        sentiment: extracted.sentiment || "neutral",
        metadata: metadata ?? {},
        topics: { create: (extracted.topics || []).map((t) => ({ name: t })) },
        actions: { create: (extracted.action_items || []).map((a) => ({ text: a })) },
        decisions: { create: (extracted.decisions || []).map((d) => ({ text: d })) },
      },
    });

    // Store participants (deduplicate by email)
    if (participants?.length) {
      for (const p of participants) {
        let existing = await prisma.participant.findUnique({ where: { email: p.email } });
        if (!existing) {
          existing = await prisma.participant.create({
            data: { name: p.name, email: p.email, role: p.role || null },
          });
        }
        await prisma.participantOnTranscript.create({
          data: { participantId: existing.id, transcriptId: newTranscript.id },
        });
      }
    }

    // Generate embeddings
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: transcript,
    });

    const vector = embeddingResponse.data[0].embedding;
    await prisma.embedding.create({
      data: { vector: JSON.stringify(vector), transcriptId: newTranscript.id },
    });

    // Summarization
    const summaryPrompt = `
    Summarize this meeting transcript in 2–3 clear sentences.
    Focus on key decisions, actions, and overall tone.
    Return only the summary text — no markdown, no explanations.

    Transcript:
    ${transcript}
    `;

    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: summaryPrompt }],
    });

    const summaryText = summaryResponse.choices[0].message?.content?.trim() || null;

    await prisma.transcript.update({
      where: { id: newTranscript.id },
      data: { summary: summaryText },
    });

    console.log(`Ingested, embedded & summarized: ${newTranscript.title}`);

    res.status(200).json({
      id: newTranscript.id,
      status: "processed",
      extracted,
      summary: summaryText,
    });
  } catch (err) {
    console.error("Ingestion error:", err);
    res.status(500).json({ error: "Failed to process transcript" });
  }
});






/**
 * @swagger
 * /api/ingest:
 *   post:
 *     summary: Ingest a meeting transcript and extract entities
 *     description: Accepts a meeting transcript, analyzes it using OpenAI, and stores extracted entities (topics, actions, decisions, sentiment) in the database.
 *     tags:
 *       - Ingestion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transcript_id:
 *                 type: string
 *                 example: meeting-001
 *               title:
 *                 type: string
 *                 example: Q4 Planning Meeting
 *               occurred_at:
 *                 type: string
 *                 example: 2025-10-15T14:00:00Z
 *               duration_minutes:
 *                 type: integer
 *                 example: 45
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john@acme.com
 *                     role:
 *                       type: string
 *                       example: speaker
 *               transcript:
 *                 type: string
 *                 example: "Full transcript text here..."
 *               metadata:
 *                 type: object
 *                 example: { "platform": "zoom", "recording_url": "https://..." }
 *     responses:
 *       200:
 *         description: Successfully processed transcript
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 extracted:
 *                   type: object
 *                   properties:
 *                     topics:
 *                       type: array
 *                       items:
 *                         type: string
 *                     action_items:
 *                       type: array
 *                       items:
 *                         type: string
 *                     decisions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     sentiment:
 *                       type: string
 */

