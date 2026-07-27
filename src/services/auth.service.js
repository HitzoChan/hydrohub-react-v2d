// =============================
// AUTH SERVICE
// =============================

export async function loginUser(email, password) {

  // Future Supabase Login
  // const { data, error } = await supabase.auth.signInWithPassword({
  //   email,
  //   password
  // });

  // Temporary Login
  if (email === "admin@gmail.com" && password === "123456") {
    return {
      success: true,
      user: {
        role: "admin",
        email
      }
    };
  }

  return {
    success: false
  };
}