import admin from 'firebase-admin';
import serviceAccount from './firebase/payoffbar-firebase-adminsdk-p5hxp-fcd8e8ca1d.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;