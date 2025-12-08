import mongoose,{Document,Schema} from "mongoose";

interface IFriend extends Document{
    userID: string,
    friendID: string,
    status: string,
    createdAt: Date
}

const friendSchema = new Schema<IFriend>({
    userID:{
        type: String,
        required: true,
    },
    friendID:{
        type: String,
        required: true,
    },
    status:{
        type: String,
        enum: ['pending', 'accepted'],
        default: 'pending'
    }
},{
    timestamps:true
});

friendSchema.index({userID:1,friendID:1},{unique:true});

export default mongoose.model<IFriend>('Friend',friendSchema);