import api, { saveToken } from "../../../services/api";

export async function signupUser({ name, email, password }) {
  await api.register({
    name: name.trim(),
    email: email.trim(),
    password,
  });

  // Registration creates the account but does not return a login token.
  const result = await api.login({
    email: email.trim(),
    password,
  });

  saveToken(result.access_token);

  return api.me();
}

export default signupUser;
