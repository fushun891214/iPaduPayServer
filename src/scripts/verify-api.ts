
import axios from 'axios';

const BASE_URL = 'http://localhost:8081/api';

// Test Data
const USER_A = { userName: 'LinusTorvalds', userID: 'linux_creator_001' };
const USER_B = { userName: 'BillGates', userID: 'windows_creator_002' };
const USER_C = { userName: 'SteveJobs', userID: 'apple_creator_003' };

let tokenA: string = '';
// let tokenB: string = '';

async function runTests() {
    console.log('🚀 Starting API Verification Tests...\n');

    try {
        // 1. Register Users
        console.log('--- 1. Register Users ---');
        await registerUser(USER_A);
        await registerUser(USER_B);
        await registerUser(USER_C);

        // 2. Login User A (to get token)
        console.log('\n--- 2. Login User A ---');
        tokenA = await loginUser(USER_A);

        // 3. Add Friend (User A adds User B)
        console.log('\n--- 3. Add Friend ---');
        await addFriend(USER_A.userID, USER_B.userID, tokenA);

        // 4. Get Friend List
        console.log('\n--- 4. Get Friend List ---');
        await getFriendList(USER_A.userID, tokenA);

        // 5. Create Group
        console.log('\n--- 5. Create Group ---');
        const groupID = await createGroup(USER_A.userID, [USER_B, USER_C], tokenA);

        if (groupID) {
            // 6. Get Group Detail
            console.log('\n--- 6. Get Group Detail ---');
            await getGroupDetail(groupID, tokenA);

            // 7. Get User Groups
            console.log('\n--- 7. Get User Groups ---');
            await getUserGroup(USER_A.userID, tokenA);

            // 8. Edit Group (Remove User C)
            console.log('\n--- 8. Edit Group (Remove User C) ---');
            await editGroup(groupID, [USER_B], tokenA);

            // 9. Get Group Detail Again
            console.log('\n--- 9. Get Group Detail (After Edit) ---');
            await getGroupDetail(groupID, tokenA);

            // 10. Delete Group
            console.log('\n--- 10. Delete Group ---');
            await deleteGroup(groupID, tokenA);
        }

        console.log('\n✅ All Tests Completed Successfully!');

    } catch (error: any) {
        console.error('\n❌ Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Helper Functions

async function registerUser(user: typeof USER_A) {
    try {
        const res = await axios.post(`${BASE_URL}/users/register`, user);
        console.log(`✅ Registered ${user.userName}:`, res.data);
    } catch (error: any) {
        if (error.response?.status === 400 && error.response?.data?.message === 'UserID already exists') {
            console.log(`⚠️ User ${user.userName} already exists, skipping registration.`);
        } else {
            throw error;
        }
    }
}

async function loginUser(user: typeof USER_A): Promise<string> {
    const res = await axios.post(`${BASE_URL}/users/login`, {
        ...user,
        fcmToken: 'dummy_fcm_token_for_test'
    });
    console.log(`✅ Logged in ${user.userName}`);
    return res.data.data.token;
}

async function addFriend(userID: string, friendID: string, token: string) {
    try {
        const res = await axios.post(`${BASE_URL}/friends/add`,
            { userID, friendID },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✅ Friend Added:`, res.data);
    } catch (error: any) {
        if (error.response?.data?.message?.includes('already friends')) {
            console.log(`⚠️ Already friends, skipping.`);
        } else {
            throw error;
        }
    }
}

async function getFriendList(userID: string, token: string) {
    const res = await axios.post(`${BASE_URL}/friends/friendshipList`,
        { userID },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Friend List of ${userID}:`, res.data.data);
}

async function createGroup(creatorID: string, members: any[], token: string): Promise<string> {
    const payload = {
        groupName: 'Test OS Group',
        creatorID: creatorID,
        members: members.map(m => ({
            userID: m.userID,
            amount: 100,
            payStatus: false
        }))
    };

    const res = await axios.post(`${BASE_URL}/group/create`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Group Created:`, res.data.data.groupID);
    return res.data.data.groupID;
}

async function getGroupDetail(groupID: string, token: string) {
    const res = await axios.get(`${BASE_URL}/group/getGroupDetail/${groupID}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Group Detail: Name=${res.data.data.groupName}, Members=${res.data.data.members.length}`);
}

async function getUserGroup(userID: string, token: string) {
    const res = await axios.get(`${BASE_URL}/group/getUserGroup/${userID}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ User Groups for ${userID}:`, res.data.data.length);
}

async function editGroup(groupID: string, members: any[], token: string) {
    const payload = {
        groupID: groupID,
        groupName: 'Updated Test OS Group',
        members: members.map(m => ({
            userID: m.userID,
            amount: 200, // Changed amount
            payStatus: false
        }))
    };

    const res = await axios.post(`${BASE_URL}/group/edit`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Group Edited:`, res.data.data.groupName);
}

async function deleteGroup(groupID: string, token: string) {
    const res = await axios.delete(`${BASE_URL}/group/deleteGroup/${groupID}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Group Deleted:`, res.data);
}

runTests();
