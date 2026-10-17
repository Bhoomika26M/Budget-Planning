import api, { saveToken } from "../../../services/api";

export async function loginUser({ email, password }) {
  const result = await api.login({
    email: email.trim(),
    password,
  });

  saveToken(result.access_token);

  return api.me();
}

export default loginUser;
