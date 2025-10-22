import { Router, Request, Response } from "express";
import { prisma } from "../db";

export const transcriptRouter = Router();

transcriptRouter.get("/", async (_: Request, res: Response): Promise<void> => {
  try {
    const transcripts = await prisma.transcript.findMany({
      include: {
        topics: true,
        actions: true,
        decisions: true,
        participants: true,
      },
    });
    res.status(200).json(transcripts);
  } catch (error) {
    console.error("Error fetching transcripts:", error);
    res.status(500).json({ error: "Failed to fetch transcripts" });
  }
});


transcriptRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const transcript = await prisma.transcript.findUnique({
      where: { id },
      include: {
        topics: true,
        actions: true,
        decisions: true,
        participants: true,
      },
    });

    if (!transcript) {
      res.status(404).json({ error: "Transcript not found" });
      return;
    }

    res.status(200).json(transcript);
  } catch (error) {
    console.error("Error fetching transcript:", error);
    res.status(500).json({ error: "Failed to fetch transcript" });
  }
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
