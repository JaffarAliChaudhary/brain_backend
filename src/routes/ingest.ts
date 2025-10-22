import express from "express";
import { prisma } from "../db";
import OpenAI from "openai";

export const ingestRouter = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

ingestRouter.post("/", async (req, res) => {
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

    let extracted: any;
    try {
      extracted = JSON.parse(content);
    } catch {
      console.error(" Failed to parse JSON:", content);
      extracted = {};
    }

    // Store or update transcript if it already exists
    let newTranscript;

    const existingTranscript = await prisma.transcript.findUnique({
      where: { transcript_id },
    });

    if (existingTranscript) {
      res.json({ id: existingTranscript.id, status: "already_exists" });
      return;
    } else {
      newTranscript = await prisma.transcript.create({
        data: {
          transcript_id,
          title,
          occurred_at: new Date(occurred_at),
          duration_minutes,
          transcript,
          sentiment: extracted.sentiment || "neutral",
          metadata,
          topics: { create: (extracted.topics || []).map((t: string) => ({ name: t })) },
          actions: { create: (extracted.action_items || []).map((a: string) => ({ text: a })) },
          decisions: { create: (extracted.decisions || []).map((d: string) => ({ text: d })) },
        },
      });
    }


    //  Store participants (deduplicate by email)
    if (participants && participants.length > 0) {
      for (const p of participants) {
        // Check if participant already exists by email
        let existing = await prisma.participant.findUnique({
          where: { email: p.email },
        });

        // Create if new
        if (!existing) {
          existing = await prisma.participant.create({
            data: {
              name: p.name,
              email: p.email,
              role: p.role || null,
            },
          });
        }

        // Link participant to this transcript
        await prisma.participantOnTranscript.create({
          data: {
            participantId: existing.id,
            transcriptId: newTranscript.id,
          },
        });
      }
    }


    // Generate embedding for semantic search
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: transcript,
    });

    const vector = embeddingResponse.data[0].embedding;

    await prisma.embedding.create({
      data: {
        vector: JSON.stringify(vector),
        transcriptId: newTranscript.id,
      },
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

    // Save summary
    await prisma.transcript.update({
      where: { id: newTranscript.id },
      data: { summary: summaryText },
    });

    console.log(`Ingested + embedded + summarized: ${newTranscript.title}`);

    res.json({
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

