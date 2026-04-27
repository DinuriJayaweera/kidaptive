import { screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

vi.mock("../../../assets/streak.png", () => ({ default: "streak.png" }));
vi.mock("../../../assets/gems.png", () => ({ default: "gems.png" }));
vi.mock("../../../assets/xps.png", () => ({ default: "xps.png" }));

import TopBarStats from "../../features/child/components/TopBarStats";

describe("TopBarStats", () => {

    it("renders XP value correctly", () => {
        render(<TopBarStats totalXp={150} streak={5} gems={12} />);
        expect(screen.getByText("150 XP")).toBeInTheDocument();
    });

    it("renders streak value correctly", () => {
        render(<TopBarStats totalXp={150} streak={5} gems={12} />);
        expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders gems value correctly", () => {
        render(<TopBarStats totalXp={150} streak={5} gems={12} />);
        expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("renders all three icons", () => {
        render(<TopBarStats totalXp={150} streak={5} gems={12} />);
        expect(screen.getByAltText("Streak")).toBeInTheDocument();
        expect(screen.getByAltText("XP")).toBeInTheDocument();
        expect(screen.getByAltText("Gems")).toBeInTheDocument();
    });

    it("renders zero values correctly", () => {
        render(<TopBarStats totalXp={0} streak={0} gems={0} />);
        expect(screen.getByText("0 XP")).toBeInTheDocument();
    });

    it("renders large values correctly", () => {
        render(<TopBarStats totalXp={9999} streak={365} gems={500} />);
        expect(screen.getByText("9999 XP")).toBeInTheDocument();
        expect(screen.getByText("365")).toBeInTheDocument();
        expect(screen.getByText("500")).toBeInTheDocument();
    });

});