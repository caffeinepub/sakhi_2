import { useCallback, useRef, useState } from "react";

const FALLBACK = { latitude: 28.6139, longitude: 77.209 };

export interface Coords {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKnown = useRef<Coords | null>(null);

  const getLocation = useCallback((): Promise<Coords> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError("Geolocation not supported");
        resolve(lastKnown.current ?? FALLBACK);
        return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c: Coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setCoords(c);
          setError(null);
          lastKnown.current = c;
          setLoading(false);
          resolve(c);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          resolve(lastKnown.current ?? FALLBACK);
        },
        { timeout: 8000, maximumAge: 60000 },
      );
    });
  }, []);

  return { coords, loading, error, getLocation };
}
