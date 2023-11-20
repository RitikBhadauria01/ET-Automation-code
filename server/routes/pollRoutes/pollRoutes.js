import express from "express";
import { pollQuiz,getQuiz,getPollResults } from "../../controllers/pollquiz";

const router = express.Router();
router.post('/create', pollQuiz);
router.get('/getQuiz', getQuiz);
router.get('/getPollResults', getPollResults);
export default router;
