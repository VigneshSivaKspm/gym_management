// frontend/api/trainer/profile.ts
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
      // Get trainer profile
      const trainer = await firebaseService.getTrainerByUserId(user.id);
      if (!trainer) {
        return res.status(404).json({ message: "Trainer profile not found" });
      }

      // Get assigned trainees
      const trainees = await firebaseService.getTraineesByTrainer(trainer.id);

      return res.status(200).json({
        success: true,
        data: {
          trainer,
          trainees_count: trainees.length,
          trainees,
        },
      });
    }

    if (req.method === "PUT") {
      // Update trainer profile
      const trainer = await firebaseService.getTrainerByUserId(user.id);
      if (!trainer) {
        return res.status(404).json({ message: "Trainer profile not found" });
      }

      const {
        specialization,
        bio,
        experience_years,
        certifications,
        hourly_rate,
        availability,
      } = req.body;

      const updateData: any = {};
      if (specialization !== undefined) updateData.specialization = specialization;
      if (bio !== undefined) updateData.bio = bio;
      if (experience_years !== undefined) updateData.experience_years = experience_years;
      if (certifications !== undefined) updateData.certifications = certifications;
      if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate;
      if (availability !== undefined) updateData.availability = availability;

      const updated = await firebaseService.updateTrainer(trainer.id, updateData);

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
