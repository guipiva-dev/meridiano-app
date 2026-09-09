/// <reference types="node" />

export const DEV_USER = {
  email: process.env.E2E_EMAIL ?? "dono@viva.dev",
  senha: process.env.E2E_SENHA ?? "meridiano123",
};
