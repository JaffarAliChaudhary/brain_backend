import { Router, Request, Response } from "express";
import { prisma } from "../db";
import OpenAI from "openai";
import { cosineSimilarity } from "../utils/cosine";

export const searchRouter = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

searchRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ error: "Missing ?q=" });
      return;
    }

    // Generate embedding for the search query
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const qVec = queryEmbedding.data[0].embedding;

    // Fetch all stored embeddings
    const allEmbeddings = await prisma.embedding.findMany({
      include: { Transcript: true },
    });

    // Compute cosine similarity scores
    const scored = allEmbeddings.map((e) => ({
      transcript: e.Transcript,
      score: cosineSimilarity(qVec, JSON.parse(e.vector)),
    }));

    // Sort and return top 5 matches
    scored.sort((a, b) => b.score - a.score);
    res.status(200).json(scored.slice(0, 5));
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform semantic search" });
  }
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

