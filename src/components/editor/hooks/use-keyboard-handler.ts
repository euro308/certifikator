import { useEffect, useCallback, useRef } from 'react';
import { useEditorContext } from '../editor-context';

export function useKeyboardHandler() {
  const {
    selectedIds, // Používáme pole ID
    setSelectedIds,
    deleteSelectedElements, // Používáme hromadné mazání
    updateElement,
    addElement,
    undo,
    redo,
    addToHistory,
    elements
  } = useEditorContext();

  // Refy pro přístup k čerstvým datům v event listeneru
  const selectedIdsRef = useRef(selectedIds);
  const elementsRef = useRef(elements);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

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

      const currentSelectedIds = selectedIdsRef.current;
      const currentElements = elementsRef.current;

      // --- CTRL + A (SELECT ALL) ---
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const allIds = currentElements.map(el => el.id);
        setSelectedIds(allIds);
        return;
      }

      // --- POHYB ŠIPKAMI ---
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (currentSelectedIds.length > 0) {
          e.preventDefault();

          const step = e.shiftKey ? 10 : 1;
          let dx = 0;
          let dy = 0;

          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;

          // Aktualizovat všechny vybrané prvky
          currentSelectedIds.forEach(id => {
            const el = currentElements.find(item => item.id === id);
            if (el) {
              updateElement(id, {
                x: el.x + dx,
                y: el.y + dy,
              });
            }
          });

          // Poznačíme si, že došlo k pohybu
          hasMovedRef.current = true;
        }
      }

      // DELETE / BACKSPACE
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentSelectedIds.length > 0) {
          e.preventDefault();
          deleteSelectedElements();
        }
      }

      // CTRL+C (Duplicate) - zatím pouze pro jeden prvek (pro zjednodušení)
      // TODO: Implementovat multi-duplicate
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        if (currentSelectedIds.length === 1) {
          const id = currentSelectedIds[0];
          const el = currentElements.find(item => item.id === id);
          if (el) {
            e.preventDefault();
            const newId = `el_${Date.now()}_copy`;
            const copy = {
              ...el,
              id: newId,
              x: el.x + 20,
              y: el.y + 20,
              name: `${el.name} (kopie)`,
            };
            addElement(copy);
          }
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
    [setSelectedIds, deleteSelectedElements, updateElement, addElement, undo, redo] // dependencies are stable methods
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // Pokud jsme pustili šipku a předtím proběhl pohyb, uložíme historii.
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (hasMovedRef.current) {
        if (addToHistory) addToHistory(elementsRef.current);
        hasMovedRef.current = false;
      }
    }
  }, [addToHistory]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
