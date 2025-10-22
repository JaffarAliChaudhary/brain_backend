import express from "express";
import { prisma } from "../db";
export const transcriptRouter = express.Router();

transcriptRouter.get("/", async (_, res) => {
  const transcripts = await prisma.transcript.findMany({
    include: { topics: true, actions: true, decisions: true, participants: true },
  });
  res.json(transcripts);
});

transcriptRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  const transcript = await prisma.transcript.findUnique({
    where: { id },
    include: { topics: true, actions: true, decisions: true, participants: true },
  });
  res.json(transcript);
});


/**
 * @swagger
 * /api/transcripts:
 *   get:
 *     summary: Get all transcripts
 *     description: Returns all stored meeting transcripts with extracted entities and participants.
 *     tags:
 *       - Transcripts
 *     responses:
 *       200:
 *         description: List of transcripts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   sentiment:
 *                     type: string
 *                   topics:
 *                     type: array
 *                     items:
 *                       type: string
 */

/**
 * @swagger
 * /api/transcripts/{id}:
 *   get:
 *     summary: Get transcript by ID
 *     description: Returns full transcript details including topics, actions, decisions, and participants.
 *     tags:
 *       - Transcripts
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Transcript ID
 *     responses:
 *       200:
 *         description: Transcript details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 transcript:
 *                   type: string
 *                 topics:
 *                   type: array
 *                   items:
 *                     type: string
 */
