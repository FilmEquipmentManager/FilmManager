import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import server from "@/networking";

type AuthContextType = {
    user: User | null;
    userData: any;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			setUser(user);
			if (user) {
				try {
					const token = await user.getIdToken();
					const response = await server.get("/api/user", {
						headers: { Authorization: `Bearer ${token}` },
					});
					setUserData(response.data);
				} catch (error) {
					console.error("Failed to fetch user data:", error);
				}
			} else {
				setUserData(null);
			}
			setLoading(false);
		});
		return unsubscribe;
	}, []);	

    return (
        <AuthContext.Provider value={{ user, userData, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);