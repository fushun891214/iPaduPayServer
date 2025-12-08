import mongoose , { Document,Schema} from "mongoose";

interface IUser extends Document{
    userName: string;
    userID: string;
    fcmToken?: string;
}

const userSchema = new Schema<IUser>({
    userName:{
        type: String,
        required: true,
        trim: true
    },
    userID:{
        type: String,
        required: true,
        trim: true
    },
    fcmToken:{
        type: String,
        required: false,
    }
},{
    timestamps:true
});

export default mongoose.model<IUser>('User',userSchema);