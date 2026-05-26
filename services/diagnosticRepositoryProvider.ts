import { DiagnosticRepository } from "./diagnostic.types";
import { diagnosticLocalRepository } from "./diagnosticLocalRepository";
import { diagnosticSupabaseRepository } from "./diagnosticSupabaseRepository";
import { hasSupabase } from "./supabaseClient";

export const diagnosticRepository: DiagnosticRepository = {
  async save(report) {
    if (hasSupabase) {
      try {
        return await diagnosticSupabaseRepository.save(report);
      } catch (error) {
        console.warn("Supabase save failed. Falling back to local repository.", error);
      }
    }
    return diagnosticLocalRepository.save(report);
  },

  async list() {
    const local = await diagnosticLocalRepository.list();
    if (hasSupabase) {
      try {
        const remote = await diagnosticSupabaseRepository.list();
        return [...remote, ...local].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (error) {
        console.warn("Supabase list failed. Returning local history.", error);
      }
    }
    return local;
  },
};

