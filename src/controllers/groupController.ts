import { Request, Response } from "express";
import prisma from "../config/prisma";
import admin from "../config/firebase";

// 定義 IMemberInput 介面，這通常應該放在 models 或 types 檔案中
interface IMemberInput {
  userID: string;
  userName?: string;
  amount: number;
  payStatus: boolean;
}

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { groupName, creatorID, members } = req.body;

    const creator = await prisma.user.findUnique({
      where: { id: creatorID },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Creator not found",
      });
    }

    const groupID = `group_${Date.now()}`;

    // 使用 Prisma 的 nested write 一次建立群組與成員
    const newGroup = await prisma.group.create({
      data: {
        id: groupID,
        groupName,
        creatorId: creatorID,
        members: {
          create: members.map((member: IMemberInput) => ({
            userId: member.userID,
            amount: member.amount,
            payStatus: false,
          })),
        },
      },
      include: {
        members: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        groupID: newGroup.id,
        groupName: newGroup.groupName,
        creatorID: newGroup.creatorId,
        members: newGroup.members.map((member) => ({
          userID: member.userId,
          amount: member.amount,
          payStatus: member.payStatus,
        })),
        createdAt: newGroup.createdAt,
      },
    });
  } catch (error) {
    console.error("Create group error", error);
    return res.status(500).json({
      success: false,
      message: "Error creating group",
    });
  }
};

export const editGroup = async (req: Request, res: Response) => {
  try {
    const {
      groupID,
      members,
      groupName,
    }: {
      groupID: string;
      members: IMemberInput[];
      groupName?: string;
    } = req.body;

    const group = await prisma.group.findUnique({
      where: { id: groupID },
      include: { creator: true },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // 使用 Transaction 確保所有變更原子化執行
    await prisma.$transaction(async (tx) => {
      // 1. 更新群組名稱
      if (groupName) {
        await tx.group.update({
          where: { id: groupID },
          data: { groupName },
        });
      }

      // 獲取現有成員
      const existingMembers = await tx.groupMember.findMany({
        where: { groupId: groupID },
      });
      const existingMemberIDs = existingMembers.map((m) => m.userId);
      const newMemberIDs = members.map((m) => m.userID);

      // 找出要刪除的成員
      const membersToDelete = existingMemberIDs.filter(
        (id) => !newMemberIDs.includes(id)
      );

      // 找出要新增的成員
      const membersToAdd = members.filter(
        (m) => !existingMemberIDs.includes(m.userID)
      );

      // 2. 刪除成員
      if (membersToDelete.length > 0) {
        await tx.groupMember.deleteMany({
          where: {
            groupId: groupID,
            userId: { in: membersToDelete },
          },
        });
      }

      // 3. 新增成員
      if (membersToAdd.length > 0) {
        await tx.groupMember.createMany({
          data: membersToAdd.map((member) => ({
            groupId: groupID,
            userId: member.userID,
            amount: member.amount,
            payStatus: false,
          })),
        });
      }

      // 4. 更新現有成員
      const membersToUpdate = members.filter((m) =>
        existingMemberIDs.includes(m.userID)
      );

      for (const member of membersToUpdate) {
        // Prisma 沒有 updateMany with different values 語法，需用迴圈
        // 但因為是在 transaction 內，安全性無虞
        await tx.groupMember.updateMany({
          where: {
            groupId: groupID,
            userId: member.userID,
          },
          data: {
            amount: member.amount,
            payStatus: member.payStatus,
          }
        });
      }
    });

    // 重新獲取完整的最新群組資料回傳
    const updatedGroup = await prisma.group.findUnique({
      where: { id: groupID },
      include: {
        creator: true,
        members: {
          include: { user: true },
        },
      },
    });

    if (!updatedGroup) throw new Error("Group retrieval failed after update");

    return res.status(200).json({
      success: true,
      data: {
        groupID: updatedGroup.id,
        groupName: updatedGroup.groupName,
        creatorID: updatedGroup.creatorId,
        creatorName: updatedGroup.creator.userName,
        members: updatedGroup.members.map((m) => ({
          userID: m.userId,
          userName: m.user.userName,
          amount: m.amount,
          payStatus: m.payStatus,
        })),
        updateAt: updatedGroup.updatedAt,
      },
    });
  } catch (error) {
    console.error("Edit group error", error);
    return res.status(500).json({
      success: false,
      message: "Error editing group",
    });
  }
};

export const getUserGroup = async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;

    // 查找我是成員的群組
    const groupsAsMember = await prisma.groupMember.findMany({
      where: { userId: userID },
      include: { group: true },
    });

    // 查找我是創建者的群組
    const groupsAsCreator = await prisma.group.findMany({
      where: { creatorId: userID },
    });

    const groupList = [
      ...groupsAsMember.map((member) => ({
        groupID: member.group.id,
        groupName: member.group.groupName,
        role: "payer",
        status: member.payStatus ? "paid" : "unpaid",
      })),
      ...groupsAsCreator.map((group) => ({
        groupID: group.id,
        groupName: group.groupName,
        role: "creator",
        status: "creator",
      })),
    ];

    // 去重複：因為如果我是 Creator 且我也把自己加入 Member，這裡會重複
    // 優先保留 Creator 角色
    const uniqueMap = new Map();
    for (const g of groupList) {
      if (!uniqueMap.has(g.groupID) || g.role === 'creator') {
        uniqueMap.set(g.groupID, g);
      }
    }
    const uniqueGroups = Array.from(uniqueMap.values());

    return res.status(200).json({
      success: true,
      data: uniqueGroups,
    });
  } catch (error) {
    console.error("Get group error", error);
    return res.status(500).json({
      success: false,
      message: "Error getting groups",
    });
  }
};

export const getGroupDetail = async (req: Request, res: Response) => {
  try {
    const { groupID } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: groupID },
      include: {
        creator: true,
        members: {
          include: { user: true },
        },
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const groupDetail = {
      groupID: group.id,
      groupName: group.groupName,
      creatorID: group.creatorId,
      creatorName: group.creator.userName,
      members: group.members.map((m) => ({
        userID: m.userId,
        userName: m.user.userName,
        amount: m.amount,
        payStatus: m.payStatus,
      })),
    };

    return res.status(200).json({
      success: true,
      data: groupDetail,
    });
  } catch (error) {
    console.error("Get group detail error", error);
    return res.status(500).json({
      success: false,
      message: "Error getting group detail",
    });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { groupID } = req.params;

    const group = await prisma.group.findUnique({ where: { id: groupID } });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // 外鍵有設定 onDelete: Cascade，所以刪除 Group 會自動刪除 GroupMember
    await prisma.group.delete({
      where: { id: groupID },
    });

    return res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Delete group error", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting group",
    });
  }
};

export const notifyUnpaidMembers = async (req: Request, res: Response) => {
  try {
    const { groupID } = req.params;

    const group = await prisma.group.findUnique({ where: { id: groupID } });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // 用 Prisma 關聯查詢一次抓出未付款成員的使用者資訊
    const unpaidMembers = await prisma.groupMember.findMany({
      where: {
        groupId: groupID,
        payStatus: false,
      },
      include: {
        user: true, // 包含使用者資訊，這樣就不用二次查詢了
      },
    });

    // 過濾掉沒有 fcmToken 的使用者
    const targets = unpaidMembers
      .map((m) => m.user)
      .filter((u) => u.fcmToken);

    if (targets.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users to notify",
      });
    }

    const notifications = targets.map((user) =>
      admin.messaging().send({
        token: user.fcmToken!,
        notification: {
          title: "付款提醒",
          body: `請記得支付${group.groupName}的款項`,
        },
        data: {
          groupID: groupID,
          type: "payment_reminder",
        },
      })
    );

    console.log("Would send notifications count: ", notifications.length);

    await Promise.all(notifications);

    return res.status(200).json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("Notify unpaid members error", error);
    return res.status(500).json({
      success: false,
      message: "Error notifying unpaid members",
    });
  }
};

export const notifyUpdatePaymentStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { groupID, userID, status } = req.params;

    const group = await prisma.group.findUnique({ where: { id: groupID } });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // 更新狀態
    // 注意：複合主鍵查詢需要用 groupId_userId 組合
    await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId: groupID,
          userId: userID,
        },
      },
      data: {
        payStatus: status === "paid",
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userID } });

    if (user && user.fcmToken) {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: "付款狀態更新",
          body: `您在群組 ${group.groupName} 的付款狀態已更新為 ${status === "paid" ? "已付款" : "尚未付款"
            }`,
        },
        data: {
          groupID: groupID,
          type: "payment_status_updated",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    console.error("Update payment status error", error);
    return res.status(500).json({
      success: false,
      message: "Error updating payment status",
    });
  }
};
