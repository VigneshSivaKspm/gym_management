// frontend/api/trainee/workouts.ts
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
      // Get workouts
      const workouts = await firebaseService.getWorkoutsByTrainee(trainee.id);
      return res.status(200).json({
        success: true,
        data: workouts,
      });
    }

    if (req.method === "POST") {
      // Create workout
      const {
        exercise_name,
        sets,
        reps,
        weight,
        duration_minutes,
        calories_burned,
        intensity,
        notes,
      } = req.body;

      if (!exercise_name) {
        return res.status(400).json({ message: "Exercise name required" });
      }

      const workout = await firebaseService.createWorkout(
        trainee.id,
        exercise_name,
        sets,
        reps,
        weight,
        duration_minutes,
        calories_burned || 0,
        intensity || "MODERATE",
        notes
      );

      return res.status(201).json({
        success: true,
        message: "Workout created successfully",
        data: workout,
      });
    }

    if (req.method === "PUT") {
      // Update workout
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ message: "Workout ID required" });
      }

      await firebaseService.updateWorkout(id, updateData);
      return res.status(200).json({
        success: true,
        message: "Workout updated successfully",
      });
    }

    if (req.method === "DELETE") {
      // Delete workout
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ message: "Workout ID required" });
      }

      await firebaseService.deleteWorkout(id);
      return res.status(200).json({
        success: true,
        message: "Workout deleted successfully",
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
