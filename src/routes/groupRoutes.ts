import express,{Request,Response} from "express";
import { auth } from "../middleware/auth";
import {
    createGroup,
    editGroup,
    getGroupDetail,
    getUserGroup,
    deleteGroup,
    notifyUnpaidMembers,
    notifyUpdatePaymentStatus
} from "../controllers/groupController";

const router = express.Router();

router.post('/create', auth, async (req:Request,res:Response) =>{
    await createGroup(req,res);
});

router.post('/edit', auth, async (req:Request,res:Response) =>{
    await editGroup(req,res);
});

router.get('/getUserGroup/:userID', auth, async (req:Request,res:Response) =>{
    await getUserGroup(req,res);
});

router.get('/getGroupDetail/:groupID', auth, async (req:Request,res:Response) =>{
    await getGroupDetail(req,res);
});

router.delete('/deleteGroup/:groupID', auth, async (req:Request,res:Response) =>{
    await deleteGroup(req,res);
});

router.get('/notifyUnpaidMembers/:groupID', auth, async (req:Request,res:Response) =>{
    await notifyUnpaidMembers(req,res);
});

router.get('/notifyUpdatePaymentStatus/:groupID/:userID/:status', auth, async (req:Request,res:Response) => {
    await notifyUpdatePaymentStatus(req,res);
});

export default router;