import mongoose,{Document,Schema} from "mongoose";

interface IGroup extends Document{
    groupID:string,
    groupName:string,
    creatorID:string,
    createdAt:Date,
    updatedAt:Date
}

const groupSchema = new Schema <IGroup> ({
    groupID:{
        type:String,
        required:true,
        unique:true
    },
    groupName:{
        type:String,
        required:true
    },
    creatorID:{
        type:String,
        required:true
    },
},{
    timestamps:true
});

export default mongoose.model<IGroup>('Group',groupSchema);