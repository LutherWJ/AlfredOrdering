import { Router } from "express";
import { getMenus } from "../controllers/menuController.ts";

const router = Router();

router.get('/', getMenus);

export default router;
