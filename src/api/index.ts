import express from "express";
import { ingestRouter } from "../routes/ingest.js";
import { transcriptRouter } from "../routes/transcripts.js";
import { analyticsRouter } from "../routes/analytics.js";
import { searchRouter } from "../routes/search.js";
import { graphRouter } from "../routes/graph.js";

import type MessageResponse from "../interfaces/message-response.js";

import emojis from "./emojis.js";

const router = express.Router();

router.get<object, MessageResponse>("/", (req, res) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
  });
});

router.use("/emojis", emojis);
router.use("/ingest", ingestRouter);
router.use("/transcripts", transcriptRouter);
router.use("/analytics", analyticsRouter);
router.use("/search", searchRouter);
router.use("/graph", graphRouter);

export default router;
