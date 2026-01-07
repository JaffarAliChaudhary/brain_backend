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


import type MessageResponse from "./interfaces/message-response.js";

import api from "./api/index.js";
// import routes from "./index.js"
import * as middlewares from "./middlewares.js";

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get<object, MessageResponse>("/", (req, res) => {
  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

app.use("/api/v1", api);
// app.use("/api/v1", routes);
// app.use("/routes", routes);
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Health check
app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
    message: "Brain backend is running smoothly",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/ingest", ingestRouter);
app.use("/transcripts", transcriptRouter);
app.use("/analytics", analyticsRouter);
app.use("/search", searchRouter);
app.use("/graph", graphRouter);

// Swagger
setupSwagger(app);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
