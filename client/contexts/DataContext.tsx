import { createContext, useContext, useEffect, useState } from "react";
import { getDatabase, ref, onValue, off } from "firebase/database";

// Define the shape of your global data
export type DataContextType = {
  barcodes: any | null;
  // add other data slices here, e.g. products, settings, etc.
  loading: boolean;
};

// Create context with default values
const DataContext = createContext<DataContextType>({
  barcodes: null,
  loading: true,
});

// Provider to wrap your app
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [barcodes, setBarcodes] = useState<any | null>(null);
  // add other useState hooks for additional data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const barcodesRef = ref(db, "Barcodes");
    // create refs for other paths similarly

    // Subscribe to Barcodes updates
    onValue(
      barcodesRef,
      (snapshot) => {
        setBarcodes(snapshot.val());
        setLoading(false);
      },
      (error) => {
        console.error("Realtime DB error (Barcodes):", error);
        setLoading(false);
      }
    );

    // return cleanup function to unsubscribe all listeners
    return () => {
      off(barcodesRef);
      // off(otherRefs) for each additional listener
    };
  }, []);

  return (
    <DataContext.Provider value={{ barcodes, loading }}>
      {children}
    </DataContext.Provider>
  );
}

// Hook to consume DataContext
export const useData = () => useContext(DataContext);