// Add the UIDs of users who should have admin access.
const ADMIN_UIDS = [
    "gXq4cEaN9yYt2zR7wXp9sFv1qHj2", // Replace with your actual admin user UID
];

export function isAdmin(uid: string): boolean {
    return ADMIN_UIDS.includes(uid);
}
