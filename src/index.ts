import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ingestRouter } from "./routes/ingest";
import { transcriptRouter } from "./routes/transcripts";
import { analyticsRouter } from "./routes/analytics";
import { searchRouter } from "./routes/search";
import { graphRouter } from "./routes/graph";
import { setupSwagger } from "./swagger";


dotenv.config();
const app = express();
app.use(
  cors({
    origin: "*", // allow all origins (for Swagger testing)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Brain backend is running smoothly",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/ingest", ingestRouter);
app.use("/api/transcripts", transcriptRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/search", searchRouter);
app.use("/api/graph", graphRouter);


app.get("/", (_, res) => res.send("Knowledge Extraction API running 🚀"));

setupSwagger(app);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));



export default app;
