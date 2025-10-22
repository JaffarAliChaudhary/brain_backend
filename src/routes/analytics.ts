import { Router, Request, Response } from "express";
import { prisma } from "../db";

export const analyticsRouter = Router();

// 📊 Get topic analytics
analyticsRouter.get("/topics", async (_: Request, res: Response): Promise<void> => {
  try {
    const result = await prisma.topic.groupBy({
      by: ["name"],
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
    });
    res.json(result);
  } catch (error) {
    console.error("Error fetching topic analytics:", error);
    res.status(500).json({ error: "Failed to fetch topic analytics" });
  }
});

// 👥 Get participant analytics
analyticsRouter.get("/participants", async (_: Request, res: Response): Promise<void> => {
  try {
    const participants = await prisma.participant.findMany({
      include: {
        meetings: {
          include: {
            Transcript: {
              select: { id: true, title: true, occurred_at: true },
            },
          },
        },
      },
    });

    const formatted = participants.map((p) => ({
      name: p.name,
      email: p.email,
      role: p.role,
      meetings_count: p.meetings.length,
      meetings: p.meetings.map((m) => m.Transcript),
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching participant analytics:", err);
    res.status(500).json({ error: "Failed to fetch participant analytics" });
  }
});

// 💬 Get sentiment trend
analyticsRouter.get("/sentiment", async (_: Request, res: Response): Promise<void> => {
  try {
    const transcripts = await prisma.transcript.findMany({
      select: {
        occurred_at: true,
        sentiment: true,
      },
      orderBy: { occurred_at: "asc" },
    });

    // Group by date (daily average sentiment)
    const grouped: Record<string, { total: number; count: number }> = transcripts.reduce(
      (acc, t) => {
        const date = t.occurred_at.toISOString().split("T")[0];
        if (!acc[date]) acc[date] = { total: 0, count: 0 };

        let score = 0;
        if (t.sentiment === "positive") score = 1;
        if (t.sentiment === "neutral") score = 0.5;
        if (t.sentiment === "negative") score = 0;

        acc[date].total += score;
        acc[date].count += 1;
        return acc;
      },
      {} as Record<string, { total: number; count: number }>
    );

    const result = Object.entries(grouped).map(([date, v]) => ({
      date,
      avg_sentiment_score: Number((v.total / v.count).toFixed(2)),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error computing sentiment trend:", error);
    res.status(500).json({ error: "Failed to compute sentiment trend" });
  }
});



/**
 * @swagger
 * /api/analytics/topics:
 *   get:
 *     summary: Get topic analytics
 *     description: Returns aggregated statistics of discussed topics across all transcripts.
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Topic analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   _count:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: integer
 */

/**
 * @swagger
 * /api/analytics/participants:
 *   get:
 *     summary: Get participant analytics
 *     description: Returns engagement metrics for each participant.
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Participant analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   meetings:
 *                     type: array
 *                     items:
 *                       type: object
 */


/**
 * @swagger
 * /api/analytics/sentiment:
 *   get:
 *     summary: Get sentiment trend over time
 *     description: Returns average sentiment scores per day based on all meeting transcripts.
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Successful response with sentiment trend data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     example: "2025-10-15"
 *                   avg_sentiment_score:
 *                     type: number
 *                     example: 0.82
 */

