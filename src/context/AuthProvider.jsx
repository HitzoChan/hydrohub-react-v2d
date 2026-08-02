import { useState } from "react";
import AuthContext from "./AuthContext";
import { loginUser } from "../services/auth.service";

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("hydrohub-user");

        return savedUser ? JSON.parse(savedUser) : null;
    });

    const loading = false;

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
                login,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}