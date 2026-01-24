import { useEffect, useCallback, useRef } from 'react';
import { useEditorContext } from '../editor-context';

export function useKeyboardHandler() {
  const {
    selectedId,
    deleteElement,
    updateElement,
    selectedElement,
    addElement,
    undo,
    redo,
    addToHistory, // Předpokládám, že toto voláte pro uložení stavu
    elements
  } = useEditorContext();

  // Ref pro aktuální element, abychom v event listeneru měli vždy čerstvá data
  // a nemuseli listener neustále obnovovat.
  const selectedElementRef = useRef(selectedElement);

  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  // Ref, abychom věděli, že jsme při tomto stisku klávesy provedli změnu (pro historii)
  const hasMovedRef = useRef(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorovat inputy
      const target = e.target as HTMLElement;
      if (
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable) &&
        target.id !== 'canvas-container'
      ) {
        return;
      }

      // --- POHYB ŠIPKAMI (Stejně jako v dokumentaci) ---
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const currentElement = selectedElementRef.current;

        if (selectedId && currentElement) {
          e.preventDefault();

          const step = e.shiftKey ? 10 : 1;
          let dx = 0;
          let dy = 0;

          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;

          // Okamžitý update (žádná animace, spoléháme na repeat rate klávesnice)
          updateElement(selectedId, {
            x: currentElement.x + dx,
            y: currentElement.y + dy,
          });

          // Poznačíme si, že došlo k pohybu (pro uložení historie po puštění klávesy)
          hasMovedRef.current = true;
        }
      }

      // DELETE / BACKSPACE
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      }

      // CTRL+C (Duplicate)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        const currentElement = selectedElementRef.current;
        if (selectedId && currentElement) {
          e.preventDefault();
          const newId = `el_${Date.now()}_copy`;
          const copy = {
            ...currentElement,
            id: newId,
            x: currentElement.x + 20,
            y: currentElement.y + 20,
            name: `${currentElement.name} (kopie)`,
          };
          addElement(copy);
        }
      }

      // UNDO / REDO
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    },
    [selectedId, deleteElement, updateElement, addElement, undo, redo]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // Pokud jsme pustili šipku a předtím proběhl pohyb, uložíme historii.
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (hasMovedRef.current) {
        // Tady zavoláme uložení do historie.
        // Ideální je zavolat to bez argumentů, pokud si Context sám sáhne pro aktuální stav,
        // nebo tomu předat aktuální stav elementů.
        if (addToHistory) addToHistory(elements);

        hasMovedRef.current = false;
      }
    }
  }, [addToHistory, elements]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}