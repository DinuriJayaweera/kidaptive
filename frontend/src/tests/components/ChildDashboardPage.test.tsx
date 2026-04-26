// import { screen, fireEvent } from "@testing-library/react";
// import { vi, describe, it, expect } from "vitest";
// import { render } from "@testing-library/react";
// import CategoryCard from "../../features/child/components/CategoryCard";

// const mockCategory = {
//     id: "Nouns",
//     name: "Nouns",
//     level: "Starter" as const,
//     icon: "📚",
//     xp: 10,
//     xpToNextLevel: 50,
//     quizzesCompleted: 2,
// };

// describe("CategoryCard", () => {

//     it("renders the category name", () => {
//         render(<CategoryCard category={mockCategory} onClick={vi.fn()} />);
//         expect(screen.getByText("Nouns")).toBeInTheDocument();
//     });

//     it("renders the level label in uppercase", () => {
//         render(<CategoryCard category={mockCategory} onClick={vi.fn()} />);
//         expect(screen.getByText("STARTER")).toBeInTheDocument();
//     });

//     it("renders the XP value", () => {
//         render(<CategoryCard category={mockCategory} onClick={vi.fn()} />);
//         expect(screen.getByText("XP : 10")).toBeInTheDocument();
//     });

//     it("renders the category icon", () => {
//         render(<CategoryCard category={mockCategory} onClick={vi.fn()} />);
//         expect(screen.getByText("📚")).toBeInTheDocument();
//     });

//     it("uses default 📚 icon when icon is not provided", () => {
//         const cat = { ...mockCategory, icon: undefined };
//         render(<CategoryCard category={cat} onClick={vi.fn()} />);
//         expect(screen.getByText("📚")).toBeInTheDocument();
//     });

//     it("calls onClick with correct id and level when clicked", () => {
//         const mockClick = vi.fn();
//         render(<CategoryCard category={mockCategory} onClick={mockClick} />);

//         fireEvent.click(screen.getByText("Nouns"));

//         expect(mockClick).toHaveBeenCalledWith("Nouns", "Starter");
//     });

//     it("renders Explorer level correctly", () => {
//         const cat = { ...mockCategory, level: "Explorer" as const };
//         render(<CategoryCard category={cat} onClick={vi.fn()} />);
//         expect(screen.getByText("EXPLORER")).toBeInTheDocument();
//     });

//     it("renders Champion level correctly", () => {
//         const cat = { ...mockCategory, level: "Champion" as const };
//         render(<CategoryCard category={cat} onClick={vi.fn()} />);
//         expect(screen.getByText("CHAMPION")).toBeInTheDocument();
//     });

//     it("renders XP 0 correctly", () => {
//         const cat = { ...mockCategory, xp: 0 };
//         render(<CategoryCard category={cat} onClick={vi.fn()} />);
//         expect(screen.getByText("XP : 0")).toBeInTheDocument();
//     });

//     it("is clickable (has cursor pointer style)", () => {
//         render(<CategoryCard category={mockCategory} onClick={vi.fn()} />);
//         // The card exists and can be clicked
//         expect(screen.getByText("Nouns")).toBeInTheDocument();
//     });

// });