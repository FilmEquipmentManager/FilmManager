import { useAuth } from "../../client/app/contexts/AuthContext";
import server from "@/networking";

export function useUserInfo() {
    const { user, userData, loading } = useAuth();

    const refreshUserData = async () => {
        if (user) {
            const token = await user.getIdToken();
            const response = await server.get("/api/user", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        }
        return null;
    };

    return {
        user,
        userData,
        loading,
        refreshUserData,
    };
}