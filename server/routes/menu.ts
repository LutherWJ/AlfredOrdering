import {Router} from "express";
import menu from "../models/menus.ts";
import {validateID} from "../utils/validation.ts";

const router = Router();

router.get('/', async (req, res) => {
    const id = req.query.id;

    // Get all menus if no ID provided
    if (id === undefined) {
        try {
            const menus = await menu.find();
            return res.json(menus);
        } catch (err) {
            return res.status(500).json({ error: "Failed to fetch menus" });
        }
    }

    if (!validateID(id)) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    // Get specific menu
    try {
        const foundMenu = await menu.findOne({ restaurant_id: id });

        if (!foundMenu) {
            return res.status(404).json({ error: `Could not find menu with restaurant id ${id}` });
        }

        return res.json(foundMenu);
    } catch (err) {
        return res.status(500).json({ error: "Database error" });
    }

})

router.post('/', async (req, res) => {

})

export default router;
