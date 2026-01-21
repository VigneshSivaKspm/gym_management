// frontend/api/trainee/profile.ts
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

    if (req.method === "GET") {
      // Get trainee profile
      const trainee = await firebaseService.getTraineeByUserId(user.id);
      if (!trainee) {
        return res.status(404).json({ message: "Trainee profile not found" });
      }

      return res.status(200).json({
        success: true,
        data: trainee,
      });
    }

    if (req.method === "PUT") {
      // Update trainee profile
      const trainee = await firebaseService.getTraineeByUserId(user.id);
      if (!trainee) {
        return res.status(404).json({ message: "Trainee profile not found" });
      }

      const { age, gender, fitness_level, height, weight, goals } = req.body;
      const updateData: any = {};

      if (age !== undefined) updateData.age = age;
      if (gender !== undefined) updateData.gender = gender;
      if (fitness_level !== undefined) updateData.fitness_level = fitness_level;
      if (height !== undefined) updateData.height = height;
      if (weight !== undefined) updateData.weight = weight;
      if (goals !== undefined) updateData.goals = goals;

      const updated = await firebaseService.updateTrainee(trainee.id, updateData);

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
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
