import { z } from "zod";

// Satu schema untuk login & signup, dipakai di form client.
// Aturan password (min 6) mengikuti default Supabase Auth.
export const authSchema = z.object({
  email: z.email("Email-nya kayaknya typo deh, cek lagi ya."),
  password: z.string().min(6, "Password minimal 6 karakter ya."),
});

export type AuthInput = z.infer<typeof authSchema>;
