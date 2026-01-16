// =============================================================================
// ADD ELEMENT SECTION - Sekce pro přidávání nových prvků
// =============================================================================

'use client';

import { Type, Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorContext } from '../editor-context';

/**
 * Sekce pro přidání nových prvků na plátno
 * 
 * Obsahuje tlačítka pro:
 * - Přidat text
 * - (Později) Přidat placeholder, tvar, obrázek
 */
export function AddElementSection() {
    const { createTextElement, createPlaceholderElement } = useEditorContext();

    const handleAddPlaceholder = () => {
        createPlaceholderElement('Promenna');
    };

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
                Textové prvky
            </h3>
            <div className="flex flex-col gap-2">
                <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={createTextElement}
                >
                    <Type className="h-4 w-4" />
                    Přidat text
                </Button>
                <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={handleAddPlaceholder}
                >
                    <Braces className="h-4 w-4" />
                    Přidat proměnnou
                </Button>
            </div>
        </div>
    );
}
