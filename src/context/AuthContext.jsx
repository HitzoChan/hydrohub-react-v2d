import { createContext, useState } from "react";
import { loginUser } from "../services/auth.service";

const AuthContext = createContext();

export default AuthContext;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("hydrohub-user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    async function login(email, password) {
        const result = await loginUser(email, password);

        if (result.success) {
            setUser(result.user);

            localStorage.setItem(
                "hydrohub-user",
                JSON.stringify(result.user)
            );
        }

        return result;
    }

    function logout() {
        localStorage.removeItem("hydrohub-user");
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading: false,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}