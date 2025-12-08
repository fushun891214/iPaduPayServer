import mongoose,{Document,Schema} from "mongoose";

// TypeScript 的型別定義，是給 TypeScript 用的（開發時期）
interface IGroupMember extends Document{
    groupID: string,
    userID: string,
    amount: number,
    payStatus: boolean,
    createdAt: Date,
    updatedAt: Date
}

export interface IMemberInput{
    userID: string,
    userName?: String,
    amount: number,
    payStatus: boolean
}

// 定義了實際資料庫的結構，是給 MongoDB 用的（執行時期）
const groupMemberSchema = new Schema<IGroupMember>({
    groupID:{
        type: String,
        required: true
    },
    userID:{
        type: String,
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    payStatus:{
        type: Boolean,
        default: false
    }
},{
    timestamps: true
});

groupMemberSchema.index({ groupID:1, userID:1},{unique:true});

export default mongoose.model<IGroupMember>('GroupMember',groupMemberSchema);