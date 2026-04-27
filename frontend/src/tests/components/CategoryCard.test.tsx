import { screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import CategoryCard from "../../features/child/components/CategoryCard";

const mockCategory = {
    id: "Nouns",
    name: "Nouns",
    level: "Starter" as const,
    icon: "📚",
    xp: 10,
    xpToNextLevel: 50,
    quizzesCompleted: 2,
};

describe("CategoryCard", () => {

    it("renders the category name", () => {
        render(<CategoryCard category={mockCategory} onClick={vi.fn()} />);
        expect(screen.getByText("Nouns")).toBeInTheDocument();
    });

    it("renders the level label as raw text (CSS uppercase not applied in jsdom)", () => {
        render(<CategoryCard category={mockCategory} onClick={vi.fn()} />);
        // textTransform: uppercase is CSS — jsdom renders raw value "Starter"
        expect(screen.getByText("Starter")).toBeInTheDocument();
    });

    it("renders Explorer level correctly", () => {
        const cat = { ...mockCategory, level: "Explorer" as const };
        render(<CategoryCard category={cat} onClick={vi.fn()} />);
        expect(screen.getByText("Explorer")).toBeInTheDocument();
    });

    it("renders Champion level correctly", () => {
        const cat = { ...mockCategory, level: "Champion" as const };
        render(<CategoryCard category={cat} onClick={vi.fn()} />);
        expect(screen.getByText("Champion")).toBeInTheDocument();
    });

    it("renders the XP value", () => {
        render(<CategoryCard category={mockCategory} onClick={vi.fn()} />);
        expect(screen.getByText(/XP.*10|10.*XP/)).toBeInTheDocument();
    });

    it("renders the category icon", () => {
        render(<CategoryCard category={mockCategory} onClick={vi.fn()} />);
        expect(screen.getByText("📚")).toBeInTheDocument();
    });

    it("uses default 📚 icon when icon is not provided", () => {
        const cat = { ...mockCategory, icon: undefined as any };
        render(<CategoryCard category={cat} onClick={vi.fn()} />);
        expect(screen.getByText("📚")).toBeInTheDocument();
    });

    it("calls onClick when card is clicked", () => {
        const mockClick = vi.fn();
        render(<CategoryCard category={mockCategory} onClick={mockClick} />);
        fireEvent.click(screen.getByText("Nouns"));
        expect(mockClick).toHaveBeenCalled();
    });

    it("renders XP 0 correctly", () => {
        const cat = { ...mockCategory, xp: 0 };
        render(<CategoryCard category={cat} onClick={vi.fn()} />);
        expect(screen.getByText(/XP.*0|0.*XP/)).toBeInTheDocument();
    });

    it("renders the card without crashing", () => {
        const { container } = render(<CategoryCard category={mockCategory} onClick={vi.fn()} />);
        expect(container.firstChild).toBeInTheDocument();
    });

});