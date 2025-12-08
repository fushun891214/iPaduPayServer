import { Request, Response } from "express";
import prisma from "../config/prisma";
import { FriendStatus } from "@prisma/client";

export const addFriend = async (req: Request, res: Response) => {
    try {
        const { userID, friendID } = req.body;

        // 簡單檢查不能加自己
        if (userID === friendID) {
            return res.status(400).json({
                success: false,
                message: "Cannot add yourself as friend",
            });
        }

        // 檢查兩個用戶是否存在
        const [user, friendUser] = await Promise.all([
            prisma.user.findUnique({ where: { id: userID } }),
            prisma.user.findUnique({ where: { id: friendID } }),
        ]);

        if (!user || !friendUser) {
            return res.status(404).json({
                success: false,
                message: "One or both users not found",
            });
        }

        // 檢查是否已經是好友 (雙向檢查)
        const existingFriendship = await prisma.friend.findFirst({
            where: {
                OR: [
                    { requesterId: userID, recipientId: friendID },
                    { requesterId: friendID, recipientId: userID },
                ],
            },
        });

        if (existingFriendship) {
            return res.status(400).json({
                success: false,
                message: "Friend request already exists or users are already friends",
            });
        }

        // 創建新的好友關係
        // 這裡我們假設 addFriend 直接就是 ACCEPTED 狀態，與原邏輯一致
        const newFriendship = await prisma.friend.create({
            data: {
                requesterId: userID,
                recipientId: friendID,
                status: FriendStatus.ACCEPTED,
            },
        });

        return res.status(201).json({
            success: true,
            data: {
                userID: newFriendship.requesterId,
                friendID: newFriendship.recipientId,
                status: newFriendship.status,
            },
        });
    } catch (error) {
        console.error("Add friend error:", error);
        return res.status(500).json({
            success: false,
            message: "Error adding friend",
        });
    }
};

export const getFriendshipList = async (req: Request, res: Response) => {
    try {
        const { userID } = req.body;

        // 檢查用戶存在
        const user = await prisma.user.findUnique({ where: { id: userID } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user not found",
            });
        }

        // 查找所有相關的好友記錄 (我是發起者 OR 我是接收者) 且狀態為 ACCEPTED
        const friendships = await prisma.friend.findMany({
            where: {
                OR: [{ requesterId: userID }, { recipientId: userID }],
                status: FriendStatus.ACCEPTED,
            },
            include: {
                requester: true,
                recipient: true,
            },
        });

        // 整理回傳資料：找出"對方"是誰
        const friendDetails = friendships.map((f) => {
            const isRequester = f.requesterId === userID;
            // 如果我是發起者，朋友就是接收者；反之亦然
            const friendData = isRequester ? f.recipient : f.requester;
            return {
                userID: friendData.id,
                userName: friendData.userName,
            };
        });

        if (friendDetails.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No friends found",
            });
        }

        return res.status(200).json({
            success: true,
            data: friendDetails,
            count: friendDetails.length,
        });
    } catch (error) {
        console.error("Get friendship list error:", error);
        return res.status(500).json({
            success: false,
            message: "Error getting friendship list",
        });
    }
};