import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { userName, userID } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userID },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "UserID already exists",
      });
    }

    const newUser = await prisma.user.create({
      data: {
        userName,
        id: userID,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        userName: newUser.userName,
        userID: newUser.id,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { userName, userID, fcmToken } = req.body;

    if (!userName || !userID) {
      return res.status(400).json({
        success: false,
        message: "Please provide both userName and userID",
      });
    }

    // 先確認使用者存在且名字正確
    const user = await prisma.user.findUnique({
      where: { id: userID },
    });

    if (!user || user.userName !== userName) {
      return res.status(401).json({
        success: false,
        message: "Invalid userName or userID",
      });
    }

    // 更新 FCM Token
    const updatedUser = await prisma.user.update({
      where: { id: userID },
      data: { fcmToken: fcmToken },
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    // 生成 JWT token
    const token = jwt.sign(
      {
        userID: updatedUser.id,
        userName: updatedUser.userName,
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      data: {
        userName: updatedUser.userName,
        userID: updatedUser.id,
        fcmToken: updatedUser.fcmToken,
        token,
      },
    });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
    });
  }
};
