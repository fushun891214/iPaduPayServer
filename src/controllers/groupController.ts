import { Request, Response } from "express";
import Group from "../models/group";
import GroupMember, { IMemberInput } from "../models/groupMember";
import User from "../models/user";
import admin from "../config/firebase";

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { groupName, creatorID, members } = req.body;

    const creator = await User.findOne({ userID: creatorID });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Creator not found",
      });
    }

    const groupID = `group_${Date.now()}`;

    const newGroup = await Group.create({
      groupID,
      groupName,
      creatorID,
    });

    const groupMembers = await Promise.all(
      members.map(async (member: IMemberInput) => {
        return await GroupMember.create({
          groupID: groupID,
          userID: member.userID,
          amount: member.amount,
          payStatus: (member.payStatus = false),
        });
      })
    );

    return res.status(201).json({
      success: true,
      data: {
        groupID: newGroup.groupID,
        groupName: newGroup.groupName,
        creatorID: newGroup.creatorID,
        members: groupMembers.map((member) => ({
          userID: member.userID,
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

    const group = await Group.findOne({ groupID: groupID });

    const creator = await User.findOne({ userID: group?.creatorID });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (groupName) {
      await Group.findOneAndUpdate({ groupID }, { groupName });
    }

    // 獲取現有成員
    const existingMembers = await GroupMember.find({ groupID });
    const existingMemberIDs = existingMembers.map((m) => m.userID);
    const newMemberIDs = members.map((m) => m.userID);

    // 找出要刪除和新增的成員
    const membersToDelete = existingMemberIDs.filter(
      (id) => !newMemberIDs.includes(id)
    );
    const membersToAdd = members.filter(
      (m) => !existingMemberIDs.includes(m.userID)
    );

    // 刪除成員
    await GroupMember.deleteMany({
      groupID,
      userID: { $in: membersToDelete },
    });

    // 新增成員
    await Promise.all(
      membersToAdd.map((member) =>
        GroupMember.create({
          groupID,
          userID: member.userID,
          amount: member.amount,
          payStatus: false,
        })
      )
    );

    // 更新現有成員
    const updatedMembers = await Promise.all(
      members
        .filter((m) => existingMemberIDs.includes(m.userID))
        .map(async (member) => {
          const updatedMember = await GroupMember.findOneAndUpdate(
            { groupID, userID: member.userID },
            {
              amount: member.amount,
              payStatus: member.payStatus,
            },
            { new: true }
          );
          const user = await User.findOne({ userID: member.userID });
          return { ...updatedMember?.toObject(), userName: user?.userName };
        })
    );

    // 獲取所有當前成員的最新狀態
    const allCurrentMembers = await Promise.all(
      newMemberIDs.map(async (userID) => {
        const member = await GroupMember.findOne({ groupID, userID });
        const user = await User.findOne({ userID });
        return {
          userID: member?.userID,
          userName: user?.userName,
          amount: member?.amount,
          payStatus: member?.payStatus,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        groupID: group.groupID,
        groupName: groupName || group.groupName,
        creatorID: group.creatorID,
        creatorName: creator?.userName,
        members: allCurrentMembers,
        updateAt: group.updatedAt,
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

    const groupAsMember = await GroupMember.find({ userID });

    const groupAsCreator = await Group.find({ creatorID: userID });

    const groupList = await Promise.all([
      ...(await Promise.all(
        groupAsMember.map(async (member) => {
          const group = await Group.findOne({ groupID: member.groupID });
          if (!group) return null;

          return {
            groupID: group.groupID,
            groupName: group.groupName,
            role: "payer",
            status: member.payStatus ? "paid" : "unpaid",
          };
        })
      )),

      ...(await groupAsCreator.map((group) => ({
        groupID: group.groupID,
        groupName: group.groupName,
        role: "creator",
        status: "creator",
      }))),
    ]);

    const uniqueGroups = groupList
      .filter((group): group is NonNullable<typeof group> => group !== null)
      .filter(
        (group, index, self) =>
          index === self.findIndex((g) => g.groupID === group.groupID)
      );

    return res.status(200).json({
      success: true,
      data: uniqueGroups,
    });
  } catch (error) {
    console.error("Get group error", error);
    return res.status(500).json({
      success: false,
      message: "Error editing group",
    });
  }
};

export const getGroupDetail = async (req: Request, res: Response) => {
  try {
    const { groupID } = req.params;

    const group = await Group.findOne({ groupID });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const creator = await User.findOne({ userID: group.creatorID });

    const groupMembers = await GroupMember.find({ groupID });

    const memberDetails = await Promise.all(
      groupMembers.map(async (member) => {
        const user = await User.findOne({ userID: member.userID });
        return {
          userID: member.userID,
          userName: user?.userName,
          amount: member.amount,
          payStatus: member.payStatus,
        };
      })
    );

    const groupDetail = {
      groupID: group.groupID,
      groupName: group.groupName,
      creatorID: group.creatorID,
      creatorName: creator?.userName,
      members: memberDetails,
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

    const group = await Group.findOne({ groupID });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    await Promise.all([
      Group.deleteOne({ groupID }),
      GroupMember.deleteMany({ groupID }),
    ]);

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

    const group = await Group.findOne({ groupID });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const unpaidMembers = await GroupMember.find({ groupID, payStatus: false });

    const unpaidUserIDs = unpaidMembers.map((member) => member.userID);

    const users = await User.find({
      userID: { $in: unpaidUserIDs },
      fcmToken: { $exists: true },
    });

    const noteifications = users.map((user) =>
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

    console.log("Would send notifications: ", noteifications);

    await Promise.all(noteifications);

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

    const group = await Group.findOne({ groupID: groupID });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    await GroupMember.updateOne(
      {
        groupID: groupID,
        userID: userID,
      },
      {
        payStatus: status === "paid",
      }
    );

    const user = await User.findOne({
      userID: userID,
      fcmToken: { $exists: true },
    });

    if (user) {
      await admin.messaging().send({
        token: user.fcmToken!,
        notification: {
          title: "付款狀態更新",
          body: `您在群組 ${group.groupName} 的付款狀態已更新為 ${
            status === "paid" ? "已付款" : "尚未付款"
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
    console.error("Update payment status error");
    return res.status(500).json({
      success: false,
      message: "Error updating payment status",
    });
  }
};
