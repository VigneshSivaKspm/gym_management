// lib/firebaseAdminService.ts
// Server-side Firestore operations for Vercel functions
import { db } from './firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'TRAINER' | 'TRAINEE';
  is_active: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Trainer {
  id: string;
  user_id: string;
  specialization?: string;
  bio?: string;
  experience_years: number;
  certifications?: string;
  hourly_rate: number;
  availability: string[];
  total_trainees: number;
  rating: number;
  created_at: Date;
}

interface Trainee {
  id: string;
  user_id: string;
  trainer_id?: string;
  age?: number;
  gender?: string;
  fitness_level: string;
  height?: number;
  weight?: number;
  goals?: string;
  membership_status: string;
  membership_end_date?: Date;
  created_at: Date;
}

interface Workout {
  id: string;
  trainee_id: string;
  exercise_name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration_minutes?: number;
  calories_burned: number;
  intensity: string;
  notes?: string;
  date: Date;
  created_at: Date;
}

interface NutritionLog {
  id: string;
  trainee_id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: string;
  date: Date;
  created_at: Date;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: Date;
}

interface Payment {
  id: string;
  trainee_id: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id?: string;
  created_at: Date;
}

class FirebaseAdminService {
  private generateId(): string {
    return uuidv4();
  }

  getCurrentTimestamp(): Date {
    return new Date();
  }

  // ============ USERS ============

  async createUser(
    email: string,
    passwordHash: string,
    name: string,
    role: string = 'TRAINEE',
    phone?: string
  ): Promise<User> {
    const userId = this.generateId();
    const userData: User = {
      id: userId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      phone,
      role: role.toUpperCase() as 'ADMIN' | 'TRAINER' | 'TRAINEE',
      is_active: true,
      is_verified: false,
      created_at: this.getCurrentTimestamp(),
      updated_at: this.getCurrentTimestamp(),
    };

    await db.collection('users').doc(userId).set(userData);
    return userData;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const snapshot = await db
      .collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as User;
  }

  async getUserById(userId: string): Promise<User | null> {
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists ? (doc.data() as User) : null;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User | null> {
    const updateData = { ...data, updated_at: this.getCurrentTimestamp() };
    await db.collection('users').doc(userId).update(updateData);
    return this.getUserById(userId);
  }

  // ============ TRAINERS ============

  async createTrainer(
    userId: string,
    specialization?: string,
    bio?: string,
    experience_years: number = 0,
    hourly_rate: number = 500
  ): Promise<Trainer> {
    const trainerId = this.generateId();
    const trainerData: Trainer = {
      id: trainerId,
      user_id: userId,
      specialization,
      bio,
      experience_years,
      hourly_rate,
      availability: [],
      total_trainees: 0,
      rating: 0,
      created_at: this.getCurrentTimestamp(),
    };

    await db.collection('trainers').doc(trainerId).set(trainerData);
    return trainerData;
  }

  async getTrainerByUserId(userId: string): Promise<Trainer | null> {
    const snapshot = await db
      .collection('trainers')
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Trainer;
  }

  async getTrainerById(trainerId: string): Promise<Trainer | null> {
    const doc = await db.collection('trainers').doc(trainerId).get();
    return doc.exists ? (doc.data() as Trainer) : null;
  }

  async getAllTrainers(limitCount: number = 100): Promise<Trainer[]> {
    const snapshot = await db.collection('trainers').limit(limitCount).get();
    return snapshot.docs.map((doc) => doc.data() as Trainer);
  }

  async updateTrainer(trainerId: string, data: Partial<Trainer>): Promise<Trainer | null> {
    await db.collection('trainers').doc(trainerId).update(data);
    return this.getTrainerById(trainerId);
  }

  // ============ TRAINEES ============

  async createTrainee(
    userId: string,
    trainerId?: string,
    age?: number,
    gender?: string,
    fitness_level: string = 'BEGINNER',
    height?: number,
    weight?: number,
    goals?: string
  ): Promise<Trainee> {
    const traineeId = this.generateId();
    const traineeData: Trainee = {
      id: traineeId,
      user_id: userId,
      trainer_id: trainerId,
      age,
      gender,
      fitness_level,
      height,
      weight,
      goals,
      membership_status: 'INACTIVE',
      created_at: this.getCurrentTimestamp(),
    };

    await db.collection('trainees').doc(traineeId).set(traineeData);
    return traineeData;
  }

  async getTraineeByUserId(userId: string): Promise<Trainee | null> {
    const snapshot = await db
      .collection('trainees')
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Trainee;
  }

  async getTraineeById(traineeId: string): Promise<Trainee | null> {
    const doc = await db.collection('trainees').doc(traineeId).get();
    return doc.exists ? (doc.data() as Trainee) : null;
  }

  async getTraineesByTrainer(trainerId: string, limitCount: number = 100): Promise<Trainee[]> {
    const snapshot = await db
      .collection('trainees')
      .where('trainer_id', '==', trainerId)
      .limit(limitCount)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Trainee);
  }

  async updateTrainee(traineeId: string, data: Partial<Trainee>): Promise<Trainee | null> {
    await db.collection('trainees').doc(traineeId).update(data);
    return this.getTraineeById(traineeId);
  }

  // ============ WORKOUTS ============

  async createWorkout(
    traineeId: string,
    exerciseName: string,
    sets?: number,
    reps?: number,
    weight?: number,
    durationMinutes?: number,
    caloriesBurned: number = 0,
    intensity: string = 'MODERATE',
    notes?: string
  ): Promise<Workout> {
    const workoutId = this.generateId();
    const workoutData: Workout = {
      id: workoutId,
      trainee_id: traineeId,
      exercise_name: exerciseName,
      sets,
      reps,
      weight,
      duration_minutes: durationMinutes,
      calories_burned: caloriesBurned,
      intensity,
      notes,
      date: this.getCurrentTimestamp(),
      created_at: this.getCurrentTimestamp(),
    };

    await db.collection('workouts').doc(workoutId).set(workoutData);
    return workoutData;
  }

  async getWorkoutsByTrainee(traineeId: string, limitCount: number = 50): Promise<Workout[]> {
    const snapshot = await db
      .collection('workouts')
      .where('trainee_id', '==', traineeId)
      .orderBy('date', 'desc')
      .limit(limitCount)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Workout);
  }

  async updateWorkout(workoutId: string, data: Partial<Workout>): Promise<void> {
    await db.collection('workouts').doc(workoutId).update(data);
  }

  async deleteWorkout(workoutId: string): Promise<void> {
    await db.collection('workouts').doc(workoutId).delete();
  }

  // ============ NUTRITION ============

  async createNutritionLog(
    traineeId: string,
    foodName: string,
    calories: number = 0,
    protein: number = 0,
    carbs: number = 0,
    fat: number = 0,
    mealType: string = 'SNACK'
  ): Promise<NutritionLog> {
    const nutritionId = this.generateId();
    const nutritionData: NutritionLog = {
      id: nutritionId,
      trainee_id: traineeId,
      food_name: foodName,
      calories,
      protein,
      carbs,
      fat,
      meal_type: mealType,
      date: this.getCurrentTimestamp(),
      created_at: this.getCurrentTimestamp(),
    };

    await db.collection('nutrition_logs').doc(nutritionId).set(nutritionData);
    return nutritionData;
  }

  async getNutritionLogs(traineeId: string, limitCount: number = 50): Promise<NutritionLog[]> {
    const snapshot = await db
      .collection('nutrition_logs')
      .where('trainee_id', '==', traineeId)
      .orderBy('date', 'desc')
      .limit(limitCount)
      .get();

    return snapshot.docs.map((doc) => doc.data() as NutritionLog);
  }

  // ============ MESSAGES ============

  async createMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const messageId = this.generateId();
    const messageData: Message = {
      id: messageId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      is_read: false,
      created_at: this.getCurrentTimestamp(),
    };

    await db.collection('messages').doc(messageId).set(messageData);
    return messageData;
  }

  async getMessages(user1Id: string, user2Id: string, limitCount: number = 50): Promise<Message[]> {
    const snap1 = await db
      .collection('messages')
      .where('sender_id', '==', user1Id)
      .where('receiver_id', '==', user2Id)
      .limit(limitCount)
      .get();

    const snap2 = await db
      .collection('messages')
      .where('sender_id', '==', user2Id)
      .where('receiver_id', '==', user1Id)
      .limit(limitCount)
      .get();

    const messages = [
      ...snap1.docs.map((doc) => doc.data() as Message),
      ...snap2.docs.map((doc) => doc.data() as Message),
    ];

    return messages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }

  // ============ PAYMENTS ============

  async createPayment(
    traineeId: string,
    amount: number,
    currency: string = 'INR',
    status: string = 'PENDING',
    transactionId?: string
  ): Promise<Payment> {
    const paymentId = this.generateId();
    const paymentData: Payment = {
      id: paymentId,
      trainee_id: traineeId,
      amount,
      currency,
      status,
      transaction_id: transactionId,
      created_at: this.getCurrentTimestamp(),
    };

    await db.collection('payments').doc(paymentId).set(paymentData);
    return paymentData;
  }

  async getPayments(traineeId: string, limitCount: number = 50): Promise<Payment[]> {
    const snapshot = await db
      .collection('payments')
      .where('trainee_id', '==', traineeId)
      .limit(limitCount)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Payment);
  }

  async updatePayment(paymentId: string, data: Partial<Payment>): Promise<void> {
    await db.collection('payments').doc(paymentId).update(data);
  }
}

const firebaseAdminService = new FirebaseAdminService();
export default firebaseAdminService;
