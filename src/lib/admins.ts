// Add the UIDs of users who should have admin access.
// 1. Sign up for a new account in the app.
// 2. Go to Firebase Console > Authentication > Users.
// 3. Copy the "User UID" for your account.
// 4. Paste it into this array.
const ADMIN_UIDS = [
    "GHo8jta5SmR1WzwYN1s7f0KPEvw1", // O'zingizning admin UID'ingiz bilan almashtiring
];

export function isAdmin(uid: string): boolean {
    if (!uid) return false;
    return ADMIN_UIDS.includes(uid);
}
