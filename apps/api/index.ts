import express, { type NextFunction , type Request , type Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import {createServer} from "http";
import { initSocket } from "./socket";
import { checkHealth } from "./controllers/health.controller";
import router from "./routes/index.route";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/health" ,checkHealth);
app.use("/api" , router);


app.use((err :any , req :Request, res:Response, next:NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT , () => {
  console.log(`Server is running on port ${PORT}`);
})