import { createContext, useCallback, useContext, useState, useRef, useEffect, type ReactNode } from "react";
import AchievementToast from "../components/AchievementToast";
import { ACHIEVEMENT_CATALOG_FRONTEND } from "../constants/achievementCatalog";

/**
 * Achievement toast plumbing.
 *
 * The flow:
 *   1. Any quiz/mistake/placement page receives `newlyUnlockedAchievements`
 *      (an array of keys like ["on_fire", "first_star"]) in the API response.
 *   2. The page calls `showAchievements(keys)` once, no further work needed.
 *   3. This provider queues them and shows one toast at a time — child gets
 *      a clean sequence ("First Star! ⭐" → "On Fire! 🔥") instead of a pile.
 *
 * The frontend keeps a tiny mirror of the catalog (titles + icons) so we
 * don't need an extra round trip to render the toast.
 */

interface AchievementContextValue {
    showAchievements: (keys: string[]) => void;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

interface ToastItem {
    title: string;
    icon: string;
}

export function AchievementProvider({ children }: { children: ReactNode }) {
    const [current, setCurrent] = useState<ToastItem | null>(null);
    const queueRef = useRef<ToastItem[]>([]);

    // Lookup keys → titles/icons from the local catalog.
    // Unknown keys are skipped silently (e.g. backend was updated faster than frontend).
    const showAchievements = useCallback((keys: string[]) => {
        if (!keys || keys.length === 0) return;
        const items: ToastItem[] = [];
        for (const k of keys) {
            const def = ACHIEVEMENT_CATALOG_FRONTEND[k];
            if (def) {
                items.push({ title: def.title, icon: def.icon });
            }
        }
        if (items.length === 0) return;

        queueRef.current.push(...items);
        // If nothing is showing, kick off display
        if (current === null) {
            const next = queueRef.current.shift()!;
            setCurrent(next);
        }
    }, [current]);

    // When the visible toast closes, advance the queue
    const handleClose = useCallback(() => {
        const next = queueRef.current.shift() ?? null;
        setCurrent(next);
    }, []);

    // Defensive cleanup: if provider unmounts while toasts are queued, drop them.
    useEffect(() => {
        return () => {
            queueRef.current = [];
        };
    }, []);

    return (
        <AchievementContext.Provider value={{ showAchievements }}>
            {children}
            <AchievementToast achievement={current} onClose={handleClose} />
        </AchievementContext.Provider>
    );
}

/**
 * `const { showAchievements } = useAchievementToasts();`
 * Then anywhere in the page after an API response:
 *   `showAchievements(response.newlyUnlockedAchievements);`
 */
export function useAchievementToasts(): AchievementContextValue {
    const ctx = useContext(AchievementContext);
    if (!ctx) {
        // Safe fallback so pages never crash if the provider is missing.
        // (e.g. during tests or storybook — toast just doesn't show.)
        return { showAchievements: () => { } };
    }
    return ctx;
}
