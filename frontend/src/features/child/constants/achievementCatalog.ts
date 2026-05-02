/**
 * Frontend mirror of achievement catalog — WITH champion sub-badges.
 */
export interface FrontendAchievementMeta {
    title: string;
    icon: string;
}

export const ACHIEVEMENT_CATALOG_FRONTEND: Record<string, FrontendAchievementMeta> = {
    // Placement
    first_crown: { title: "First Crown", icon: "👑" },
    starter_crown: { title: "Starter Crown", icon: "🥉" },
    explorer_crown: { title: "Explorer Crown", icon: "🥈" },
    champion_crown: { title: "Champion Crown", icon: "🥇" },

    // Streak
    on_fire: { title: "On Fire", icon: "🔥" },
    super_flame: { title: "Super Flame", icon: "🔥🔥" },
    unstoppable: { title: "Unstoppable", icon: "🚀" },

    // Quiz
    first_star: { title: "First Star", icon: "⭐" },
    quiz_explorer: { title: "Quiz Explorer", icon: "🌟" },
    lesson_hero: { title: "Lesson Hero", icon: "🏆" },

    // Gem
    gem_collector: { title: "Gem Collector", icon: "💎" },
    treasure_master: { title: "Treasure Master", icon: "💰" },

    // Accuracy
    perfect_shot: { title: "Perfect Shot", icon: "🎯" },
    sharp_thinker: { title: "Sharp Thinker", icon: "🧠" },

    // Champion Badges (NEW)
    champion_bronze: { title: "Champion Bronze", icon: "🥉" },
    champion_silver: { title: "Champion Silver", icon: "🥈" },
    champion_gold: { title: "Champion Gold", icon: "🥇" },
    champion_master: { title: "Champion Master", icon: "👑" },

    // Special
    level_up_hero: { title: "Level Up Hero", icon: "📈" },
    champion_legend: { title: "Champion Legend", icon: "👑" },
    mistake_master: { title: "Mistake Master", icon: "✅" },
};
