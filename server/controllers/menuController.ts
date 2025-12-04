import { Request, Response } from "express";
import Menu from "../models/Menu.ts";
import { isValidObjectId } from "../utils/validation.ts";

export async function getMenus(req: Request, res: Response) {
    const id = req.query.id;

    // Get all menus if no ID provided
    if (id === undefined) {
        try {
            const menus = await Menu.find();
            return res.json(menus);
        } catch (err) {
            return res.status(500).json({ error: "Failed to fetch menus" });
        }
    }

    if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Get specific menu
    try {
        const foundMenu = await Menu.findOne({ restaurant_id: id });

        if (!foundMenu) {
            return res.status(404).json({ error: `Could not find menu with restaurant id ${id}` });
        }

        return res.json(foundMenu);
    } catch (err) {
        return res.status(500).json({ error: "Database error" });
    }
}