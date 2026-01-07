import express from "express";
import { ingestRouter } from "./ingest";
import { transcriptRouter } from "./transcripts";
import { analyticsRouter } from "./analytics";
import { searchRouter } from "./search";
import { graphRouter } from "./graph";


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
