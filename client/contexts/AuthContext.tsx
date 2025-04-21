import { createContext, useContext, useEffect, useState } from "react";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { getDatabase, ref, onValue, off } from "firebase/database";
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
        let userRefCleanup: (() => void) | null = null;
    
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                user.getIdToken().then((token) => {
                    console.log("Token:", token);
                });
                
                const db = getDatabase();
                const userRef = ref(db, `Users/${user.uid}`);
    
                userRefCleanup = () => off(userRef);
    
                onValue(userRef, (snapshot) => {
                    const data = snapshot.val();
                    setUserData(data);
                    setLoading(false);
                }, (error) => {
                    showToast("Uh-oh!", "Failed to load user data.");
                    console.error("Realtime DB error:", error);
                    setLoading(false);
                });
            } else {
                setUserData(null);
                setLoading(false);
            }
        });
    
        return () => {
            unsubscribeAuth();
            if (userRefCleanup) userRefCleanup();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, userData, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);