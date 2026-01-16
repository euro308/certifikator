// =============================================================================
// TEXT EDITOR - Komponenta pro editaci textu uvnitř Konva Stage
// =============================================================================
// Používá Html z react-konva-utils - přesně podle Konva dokumentace

'use client';

import { useRef, useEffect } from 'react';
import { Html } from 'react-konva-utils';
import type Konva from 'konva';

interface TextEditorProps {
    textNode: Konva.Text;
    onClose: () => void;
    onChange: (newText: string) => void;
    initialValue?: string; // Volitelná počáteční hodnota (pro placeholdery)
}

/**
 * Textarea komponenta pro editaci textu
 * Přesně podle Konva dokumentace
 */
function TextArea({ textNode, onClose, onChange, initialValue }: TextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const textPosition = textNode.position();

        // Match styles with the text node
        textarea.value = initialValue ?? textNode.text();
        textarea.style.position = 'absolute';
        textarea.style.top = `${textPosition.y}px`;
        textarea.style.left = `${textPosition.x}px`;
        textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
        textarea.style.height = `${textNode.height() - textNode.padding() * 2 + 5}px`;
        textarea.style.fontSize = `${textNode.fontSize()}px`;
        textarea.style.border = 'none';
        textarea.style.padding = '0px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = String(textNode.lineHeight());
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = textNode.align();
        textarea.style.color = textNode.fill() as string;

        const rotation = textNode.rotation();
        let transform = '';
        if (rotation) {
            transform += `rotateZ(${rotation}deg)`;
        }
        textarea.style.transform = transform;

        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight + 3}px`;

        textarea.focus();

        const handleOutsideClick = (e: MouseEvent) => {
            if (e.target !== textarea) {
                onChange(textarea.value);
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onChange(textarea.value);
                onClose();
            }
        };

        const handleInput = () => {
            const scale = textNode.getAbsoluteScale().x;
            textarea.style.width = `${textNode.width() * scale}px`;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight + textNode.fontSize()}px`;
        };

        textarea.addEventListener('keydown', handleKeyDown);
        textarea.addEventListener('input', handleInput);
        setTimeout(() => {
            window.addEventListener('click', handleOutsideClick);
        });

        return () => {
            textarea.removeEventListener('keydown', handleKeyDown);
            textarea.removeEventListener('input', handleInput);
            window.removeEventListener('click', handleOutsideClick);
        };
    }, [textNode, onChange, onClose, initialValue]);

    return (
        <textarea
            ref={textareaRef}
            style={{
                minHeight: '1em',
                position: 'absolute',
            }}
        />
    );
}

/**
 * TextEditor wrapper - používá Html z react-konva-utils
 */
export function TextEditor(props: TextEditorProps) {
    return (
        <Html>
            <TextArea {...props} />
        </Html>
    );
}
