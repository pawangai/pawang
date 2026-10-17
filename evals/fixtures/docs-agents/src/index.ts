export function createUser(email: string) {
  if (!email) return { status: 500, body: { error: "server error" } };
  return { status: 201, body: { email } };
}
