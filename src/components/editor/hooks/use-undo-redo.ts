import { useState, useCallback, useRef } from 'react';
import type { CanvasElement } from '../types/canvas-types';

interface UseUndoRedoProps {
  initialElements: CanvasElement[];
  maxHistory?: number;
}

export function useUndoRedo({ initialElements = [], maxHistory = 50 }: UseUndoRedoProps) {
  // Historie stavů (pole polí elementů)
  // Používáme useRef pro samotnou historii, abychom nezpůsobovali re-rendery při každém pushi
  // Ale potřebujeme re-render pro update tlačítek undo/redo, takže index je state
  const historyRef = useRef<CanvasElement[][]>([initialElements]);
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * Přidá nový stav do historie
   * Mělo by se volat POUZE když uživatel dokončí akci (onDragEnd, onTransformEnd),
   * ne při každém pohybu myší!
   */
  const addToHistory = useCallback((newElements: CanvasElement[]) => {
    // Pokud jsme uprostřed historie a uděláme změnu, zahodíme "budoucnost"
    const newHistory = historyRef.current.slice(0, currentIndex + 1);

    newHistory.push(newElements);

    // Omezit velikost historie
    if (newHistory.length > maxHistory) {
      newHistory.shift();
    }

    historyRef.current = newHistory;
    // Nastavíme index na konec (na nový stav) - ale pozor, setIndex je asynchronní
    // Pro undo/redo to nevadí, ale musíme vědět, že current index v refu odpovídá délce-1
    setCurrentIndex(newHistory.length - 1);

    console.log(`[UndoRedo] Added to history. Size: ${newHistory.length}, Index: ${newHistory.length - 1}`);
  }, [currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      console.log(`[UndoRedo] Undo to index: ${newIndex}`);
      return historyRef.current[newIndex];
    }
    return null;
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < historyRef.current.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      console.log(`[UndoRedo] Redo to index: ${newIndex}`);
      return historyRef.current[newIndex];
    }
    return null;
  }, [currentIndex]);

  const resetHistory = useCallback((elements: CanvasElement[]) => {
    historyRef.current = [elements];
    setCurrentIndex(0);
  }, []);

  return {
    addToHistory,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < historyRef.current.length - 1,
    resetHistory
  };
}
