// Add the UIDs of users who should have admin access.
// 1. Sign up for a new account in the app.
// 2. Go to Firebase Console > Authentication > Users.
// 3. Copy the "User UID" for your account.
// 4. Paste it into this array.
const ADMIN_UIDS = [
    "REPLACE_WITH_YOUR_ADMIN_UID", // O'zingizning admin UID'ingiz bilan almashtiring
];

export function isAdmin(uid: string): boolean {
    return ADMIN_UIDS.includes(uid);
}
