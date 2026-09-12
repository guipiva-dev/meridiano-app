import { describe, expect, it } from "vitest";
import { plural } from "./plural";

describe("plural", () => {
  it("usa singular só para 1", () => {
    expect(plural(1, "reserva", "reservas")).toBe("1 reserva");
    expect(plural(0, "reserva", "reservas")).toBe("0 reservas");
    expect(plural(2, "reserva", "reservas")).toBe("2 reservas");
  });
});
