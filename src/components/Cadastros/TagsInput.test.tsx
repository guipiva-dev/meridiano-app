import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { TagsInput } from "./TagsInput";

function Montagem({ inicial = [] as string[] }) {
  const [tags, setTags] = useState<string[]>(inicial);
  return <TagsInput value={tags} onChange={setTags} aria-label="Tags" />;
}

test("Enter adiciona uma tag e não duplica", async () => {
  const user = userEvent.setup();
  render(<Montagem />);
  const input = screen.getByLabelText("Tags");

  await user.type(input, "lua de mel{Enter}");
  expect(screen.getByText("lua de mel")).toBeInTheDocument();

  await user.type(input, "lua de mel{Enter}");
  expect(screen.getAllByText("lua de mel")).toHaveLength(1);
});

test("botão × remove a tag", async () => {
  const user = userEvent.setup();
  render(<Montagem inicial={["vip"]} />);
  expect(screen.getByText("vip")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Remover vip" }));
  expect(screen.queryByText("vip")).not.toBeInTheDocument();
});

test("Backspace com o campo vazio remove a última tag", async () => {
  const user = userEvent.setup();
  render(<Montagem inicial={["a", "b"]} />);
  const input = screen.getByLabelText("Tags");

  await user.click(input);
  await user.keyboard("{Backspace}");

  expect(screen.getByText("a")).toBeInTheDocument();
  expect(screen.queryByText("b")).not.toBeInTheDocument();
});
