export function canWrite(role) {
  return role === "admin" || role === "operator";
}

export function isAdmin(role) {
  return role === "admin";
}

export function isViewer(role) {
  return role === "viewer";
}
