import client from "./client";

// TODO: connected to POST /login
export async function loginRequest(username, password) {
  const res = await client.post(
    "/auth/login",
    new URLSearchParams({ username, password }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return res.data; // { access_token, token_type }
}