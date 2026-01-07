import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { ingestRouter } from "./routes/ingest";
import { transcriptRouter } from "./routes/transcripts";
import { analyticsRouter } from "./routes/analytics";
import { searchRouter } from "./routes/search";
import { graphRouter } from "./routes/graph";
import { setupSwagger } from "./swagger";
import * as middlewares from "./middlewares";

const app = express();

// core middleware (ONCE)
app.use(morgan("dev"));
app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// root
app.get("/", (_, res) => {
  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

// health
app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
    message: "Brain backend is running smoothly",
    timestamp: new Date().toISOString(),
  });
});

// API routes (NO /api here)
app.use("/ingest", ingestRouter);
app.use("/transcripts", transcriptRouter);
app.use("/analytics", analyticsRouter);
app.use("/search", searchRouter);
app.use("/graph", graphRouter);

// swagger
setupSwagger(app);

// errors
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
