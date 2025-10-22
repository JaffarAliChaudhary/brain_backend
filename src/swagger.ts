import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import fs from "fs";




const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Brain Knowledge Extraction API",
            version: "1.0.0",
            description: "API documentation for the Knowledge Extraction service",
        },
    servers: [
      { url: "http://localhost:8000", description: "Local server" },
    ],
},
apis: ["./src/routes/*.ts"], // scans all route files for @swagger comments
};

const swaggerSpec = swaggerJSDoc(options);

fs.writeFileSync("./swagger.json", JSON.stringify(swaggerSpec, null, 2));

export function setupSwagger(app: Express) {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
