import { Request, Response } from "express";
import User from "../models/user";
import Friend from "../models/friend";
import friend from "../models/friend";

export const addFriend = async (req: Request, res: Response) => {
    try {
        const { userID, friendID } = req.body;
        // console.log('Request body:', req.body);
        // console.log('Current user:', req.user);

        // 查詢發送好友邀請的用戶
        const user = await User.findOne({ userID:userID });
        // 查找要加為好友的用戶
        const friendUser = await User.findOne({ userID:friendID });

        if (!user || !friendUser) {
            return res.status(404).json({
                success: false,
                message: 'One or both users not found'
            });
        }

        // 從 auth 中間件獲取當前用戶信息
        // const currentUser = req.user;
        // if (!currentUser) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Not authenticated'
        //     });
        // }

        // 檢查是否嘗試加自己為好友
        if (userID === friendID) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add yourself as friend'
            });
        }

        // 檢查是否已經是好友
        const existingFriendship = await Friend.findOne({
            $or: [
                { userID: userID, friendID: friendID },
                { userID: friendID, friendID: userID }
            ]
        });

        if (existingFriendship) {
            return res.status(400).json({
                success: false,
                message: 'Friend request already exists or users are already friends'
            });
        }

        // 打印詳細信息
        // console.log('Creating friendship with:', {
        //     userID: currentUser.userID,
        //     friendID: userID,
        //     userName: currentUser.userName,
        //     friendName: userName
        // });

        // 創建新的好友關係
        const newFriendship = await Friend.create({
            userID: userID,
            friendID: friendID,
            status: 'accepted'
        });

        return res.status(201).json({
            success: true,
            data: {
                // friendshipId: newFriendship._id,
                userID: newFriendship.userID,
                friendID: newFriendship.friendID,
                // userName: newFriendship.userName,
                // friendName: newFriendship.friendName,
                status: newFriendship.status,
                // createdAt: newFriendship.createdAt
            }
        });
    } catch (error) {
        console.error('Add friend error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error adding friend',
        });
    }
};

export const getFriendshipList = async (req:Request, res:Response) => {
    try{
        const {userID} = req.body;

        const user = await User.findOne({userID:userID});

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'user not found'
            });
        }

        const friendshipList = await Friend.aggregate([
            {
                $match:{
                    $or:[
                        {userID:userID},
                        {friendID:userID}
                    ],
                    status:'accepted'
                }
            },
            {
                $group:{
                    _id:{
                        $cond:[
                            {$eq:['$userID',userID]},
                            "$friendID",
                            "$userID"
                        ]
                    }
                }
            },
        ]);

        const friendDetails = await Promise.all(
            friendshipList.map(async (friend) => {
                const friendUser = await User.findOne({userID:friend._id});
                return{
                    userID: friendUser?.userID,
                    userName: friendUser?.userName
                }
            })
        )

        if(friendshipList.length === 0){
            return res.status(200).json({
                success:true,
                data:[],
                message:'No friends found'
            })
        }

        return res.status(200).json({
            success:true,
            data:friendDetails,
            count:friendshipList.length
        });
    }catch(error){
        return res.status(500).json({
            success:false,
            message:'Error getting friendship list'
        });
    }
}