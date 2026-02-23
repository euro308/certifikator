// =============================================================================
// USE TEMPLATE DRAFT - Hook pro ukládání draftu šablony do localStorage
// =============================================================================

import { useCallback } from "react";
import type { TemplateExportData } from "@/components/editor/types/canvas-types";

/** Klíč pro localStorage */
const DRAFT_KEY = "template-draft";

/**
 * Hook pro správu draftu šablony v localStorage
 *
 * Použití:
 * - saveDraft(data) - Uloží data šablony do localStorage
 * - loadDraft() - Načte data z localStorage (nebo null)
 * - clearDraft() - Smaže draft z localStorage
 * - hasDraft() - Vrátí true, pokud existuje uložený draft
 */
export function useTemplateDraft() {
  /**
   * Uloží data šablony do localStorage
   */
  const saveDraft = useCallback((data: TemplateExportData) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      alert("Uložení konceptu se nezdařilo!");
    }
  }, []);

  /**
   * Načte data šablony z localStorage
   * @returns TemplateExportData nebo null pokud draft neexistuje
   */
  const loadDraft = useCallback((): TemplateExportData | null => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        return JSON.parse(stored) as TemplateExportData;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Smaže draft z localStorage
   */
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  /**
   * Zkontroluje, zda existuje uložený draft
   */
  const hasDraft = useCallback((): boolean => {
    return localStorage.getItem(DRAFT_KEY) !== null;
  }, []);

  return { saveDraft, loadDraft, clearDraft, hasDraft };
}
