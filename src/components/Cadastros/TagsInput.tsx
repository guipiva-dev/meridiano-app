import { X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { IconButton, Input } from "@/components";
import { Chip } from "@/components/display";
import s from "./Cadastros.module.css";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  id?: string;
  "aria-label"?: string;
}

export function TagsInput({ value, onChange, id, "aria-label": ariaLabel = "Tags" }: TagsInputProps) {
  const [rascunho, setRascunho] = useState("");

  function remover(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function adicionar() {
    const tag = rascunho.trim();
    setRascunho("");
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionar();
    } else if (e.key === "Backspace" && rascunho === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className={s.tagsInput}>
      {value.map((tag) => (
        <span key={tag} className={s.tag}>
          <Chip selected>{tag}</Chip>
          <IconButton
            label={`Remover ${tag}`}
            icon={<X size={14} />}
            onClick={() => {
              remover(tag);
            }}
          />
        </span>
      ))}
      <Input
        id={id}
        aria-label={ariaLabel}
        placeholder="+ tag"
        value={rascunho}
        onChange={(e) => {
          setRascunho(e.target.value);
        }}
        onKeyDown={aoTeclar}
      />
    </div>
  );
}
