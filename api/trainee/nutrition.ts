// frontend/api/trainee/nutrition.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import firebaseService from "../../lib/firebaseService";
import { verifyToken } from "../../lib/auth";

async function getAuthUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload || !payload.sub) {
    return null;
  }

  return await firebaseService.getUserById(payload.sub);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const trainee = await firebaseService.getTraineeByUserId(user.id);
    if (!trainee) {
      return res.status(404).json({ message: "Trainee profile not found" });
    }

    if (req.method === "GET") {
      // Get nutrition logs
      const logs = await firebaseService.getNutritionLogs(trainee.id);
      return res.status(200).json({
        success: true,
        data: logs,
      });
    }

    if (req.method === "POST") {
      // Create nutrition log
      const { food_name, calories, protein, carbs, fat, meal_type } = req.body;

      if (!food_name) {
        return res.status(400).json({ message: "Food name required" });
      }

      const log = await firebaseService.createNutritionLog(
        trainee.id,
        food_name,
        calories || 0,
        protein || 0,
        carbs || 0,
        fat || 0,
        meal_type || "SNACK"
      );

      return res.status(201).json({
        success: true,
        message: "Nutrition log created successfully",
        data: log,
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error: any) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
