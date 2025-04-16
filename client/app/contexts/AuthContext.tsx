import { createContext, useContext, useEffect, useState } from "react";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
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

	const toast = useToast();

	const showToast = (title: string, description: string) => {
        const newId = Math.random();
        toast.show({
            id: newId.toString(),
            placement: "top",
            duration: 3000,
            render: ({ id }) => {
                const uniqueToastId = "toast-" + id;
                return (
                    <Toast nativeID={uniqueToastId} action="muted" variant="solid">
                        <ToastTitle>{title}</ToastTitle>
                        <ToastDescription>{description}</ToastDescription>
                    </Toast>
                );
            },
        });
    };

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
					if (error.response && error.response.data && error.response.data.error && typeof error.response.data.error === "string") {
						if (error.response.data.error.startsWith("UERROR")) {
							showToast("Uh-oh!", error.response.data.error.substring("UERROR:".length));
							console.error(error.response.data.error.substring("UERROR:".length))
						} else {
							showToast("Uh-oh!", error.response.data.error.substring("ERROR:".length));
							console.error(error.response.data.error.substring("ERROR:".length))
						}
					}
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