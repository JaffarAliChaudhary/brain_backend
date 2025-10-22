import express from "express";
import { prisma } from "../db";
import OpenAI from "openai";
import { cosineSimilarity } from "../utils/cosine";

export const searchRouter = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

searchRouter.get("/", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "Missing ?q=" });

  const queryEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const qVec = queryEmbedding.data[0].embedding;

  const all = await prisma.embedding.findMany({ include: { Transcript: true } });
  const scored = all.map(e => ({
    transcript: e.Transcript,
    score: cosineSimilarity(qVec, JSON.parse(e.vector)),
  }));
  scored.sort((a, b) => b.score - a.score);
  res.json(scored.slice(0, 5));
});


/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Semantic search over meeting transcripts
 *     description: Returns the top 5 most relevant transcripts based on semantic similarity using OpenAI embeddings.
 *     tags:
 *       - Search
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Search query text
 *         schema:
 *           type: string
 *           example: budget planning
 *     responses:
 *       200:
 *         description: List of relevant transcripts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   transcript:
 *                     type: object
 *                   score:
 *                     type: number
 */

