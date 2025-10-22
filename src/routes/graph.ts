import { Router } from "express";
import { prisma } from "../db";

export const graphRouter = Router();

graphRouter.get("/connections", async (req, res) => {
  try {
    const participants = await prisma.participant.findMany({
      include: {
        meetings: {
          include: {
            Transcript: {
              include: { topics: true }
            }
          }
        }
      }
    });

    const connections = participants.map((p) => {
      const topics = new Set<string>();
      let interactionCount = 0;

      p.meetings.forEach((m) => {
        m.Transcript.topics.forEach((t) => topics.add(t.name));
        interactionCount++;
      });

      return {
        person: p.name,
        organization: p.email.split("@")[1] || "Unknown",
        topics: Array.from(topics),
        interaction_count: interactionCount
      };
    });

    res.json({ connections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate graph insights" });
  }
});

/**
 * @swagger
 * /api/graph/connections:
 *   get:
 *     summary: Get relationship insights between entities
 *     description: Returns connections between participants, organizations, and topics based on shared meetings.
 *     tags:
 *       - Graph
 *     responses:
 *       200:
 *         description: Successfully retrieved graph insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connections:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       person:
 *                         type: string
 *                         example: "John Doe"
 *                       organization:
 *                         type: string
 *                         example: "ACME Corp"
 *                       topics:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Budget", "Marketing"]
 *                       interaction_count:
 *                         type: integer
 *                         example: 5
 */
