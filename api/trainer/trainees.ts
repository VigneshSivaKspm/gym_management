// frontend/api/trainer/trainees.ts
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

    const trainer = await firebaseService.getTrainerByUserId(user.id);
    if (!trainer) {
      return res.status(404).json({ message: "Trainer profile not found" });
    }

    if (req.method === "GET") {
      // Get all trainees assigned to this trainer
      const trainees = await firebaseService.getTraineesByTrainer(trainer.id);

      return res.status(200).json({
        success: true,
        data: trainees,
      });
    }

    if (req.method === "POST") {
      // Assign trainee to trainer
      const { trainee_id } = req.body;
      if (!trainee_id) {
        return res.status(400).json({ message: "Trainee ID required" });
      }

      const trainee = await firebaseService.getTraineeById(trainee_id);
      if (!trainee) {
        return res.status(404).json({ message: "Trainee not found" });
      }

      // Update trainee with trainer ID
      const updated = await firebaseService.updateTrainee(trainee_id, {
        trainer_id: trainer.id,
      });

      // Update trainer count
      await firebaseService.updateTrainer(trainer.id, {
        total_trainees: (trainer.total_trainees || 0) + 1,
      });

      return res.status(200).json({
        success: true,
        message: "Trainee assigned successfully",
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
