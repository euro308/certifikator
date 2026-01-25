// =============================================================================
// CANVAS TYPES - Definice všech typů pro editor šablon
// =============================================================================

/**
 * Rozměry plátna A4 na ležato (landscape)
 * 297mm × 210mm při 96 DPI = 1123 × 794 px
 */
export const CANVAS_WIDTH = 1123;
export const CANVAS_HEIGHT = 794;

/**
 * Dostupné fonty pro text
 */
export const AVAILABLE_FONTS = [
    'Arial',
    'Times New Roman',
    'Montserrat',
    'Roboto',
    'Open Sans',
    'Georgia',
    'Courier New',
] as const;

export type FontFamily = (typeof AVAILABLE_FONTS)[number];

/**
 * Typy zarovnání textu
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * Typy Konva tvarů dostupných v editoru
 */
export type ShapeType =
    | 'arc'
    | 'arrow'
    | 'circle'
    | 'ellipse'
    | 'line'
    | 'rect'
    | 'regularPolygon'
    | 'triangle'
    | 'ring'
    | 'star'
    | 'wedge'
    | 'square';

/**
 * Typy všech prvků na plátně
 */
export type ElementType = 'text' | 'placeholder' | 'shape' | 'image';

/**
 * Základní vlastnosti společné pro všechny prvky
 */
export interface BaseElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    visible: boolean;
    locked: boolean;
    name: string; // Pro zobrazení ve vrstvách
}

/**
 * Textový prvek - běžný text na plátně
 */
export interface TextElement extends BaseElement {
    type: 'text';
    text: string;
    fontFamily: FontFamily;
    fontSize: number;
    fontStyle: 'normal' | 'bold' | 'italic' | 'italic bold';
    textDecoration: '' | 'underline';
    align: TextAlign;
    fill: string; // Barva textu
}

/**
 * Placeholder prvek - speciální text s proměnnou {{nazev}}
 * Při generování certifikátu se nahradí skutečnými daty
 */
export interface PlaceholderElement extends BaseElement {
    type: 'placeholder';
    placeholderKey: string; // Např. "Jméno" (bez závorek)
    displayText: string; // Jak se zobrazuje na plátně: "{{Jméno}}"
    fontFamily: FontFamily;
    fontSize: number;
    fontStyle: 'normal' | 'bold' | 'italic' | 'italic bold';
    textDecoration: '' | 'underline';
    align: TextAlign;
    fill: string;
    backgroundColor: string;
}

/**
 * Tvarový prvek - geometrické tvary z Konva
 */
export interface ShapeElement extends BaseElement {
    type: 'shape';
    shapeType: ShapeType;
    fill: string; // Barva výplně
    stroke: string; // Barva okraje
    strokeWidth: number; // Tloušťka okraje
    // Specifické vlastnosti pro různé tvary
    innerRadius?: number; // Pro ring, star
    outerRadius?: number; // Pro ring, star
    numPoints?: number; // Pro star
    sides?: number; // Pro regularPolygon (3=trojúhelník, 5=pětiúhelník, 6=šestiúhelník)
    angle?: number; // Pro arc, wedge
    points?: number[]; // Pro line, arrow
    pointerLength?: number; // Pro arrow
    pointerWidth?: number; // Pro arrow
}

/**
 * Obrázkový prvek
 */
export interface ImageElement extends BaseElement {
    type: 'image';
    src: string; // Base64 nebo URL obrázku
    originalWidth: number;
    originalHeight: number;
}

/**
 * Union type pro všechny typy prvků
 */
export type CanvasElement = TextElement | PlaceholderElement | ShapeElement | ImageElement;

// =============================================================================
// EDITOR STATE TYPES
// =============================================================================

/**
 * Stav pro panning (posun plátna při zoomu)
 */
export interface PanState {
    x: number;
    y: number;
}

/**
 * Konfigurace zoomu
 */
export interface ZoomConfig {
    min: number;
    max: number;
    step: number;
}

export const DEFAULT_ZOOM_CONFIG: ZoomConfig = {
    min: 0.25, // 25%
    max: 4.0,  // 400%
    step: 0.1, // 10% kroky
};

/**
 * Vodící čáry pro centrování
 */
export interface CenteringGuides {
    showVertical: boolean;
    showHorizontal: boolean;
    verticalX: number;
    horizontalY: number;
}

// =============================================================================
// DEFAULT VALUES - Výchozí hodnoty pro nové prvky
// =============================================================================

/**
 * Výchozí hodnoty pro nový textový prvek
 */
export const DEFAULT_TEXT_ELEMENT: Omit<TextElement, 'id' | 'x' | 'y' | 'name'> = {
    type: 'text',
    text: 'Nový text',
    width: 110, // 110 přesně na text "Nový text" v boldu
    height: 24,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fontFamily: 'Arial',
    fontSize: 24,
    fontStyle: 'normal',
    textDecoration: '',
    align: 'left',
    fill: '#000000', // Černý text
};

/**
 * Výchozí hodnoty pro nový placeholder
 */
export const DEFAULT_PLACEHOLDER_ELEMENT: Omit<PlaceholderElement, 'id' | 'x' | 'y' | 'name' | 'placeholderKey' | 'displayText'> = {
    type: 'placeholder',
    width: 143, // 143 přesně na text "Proměnná"
    height: 25,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fontFamily: 'Arial',
    fontSize: 24,
    fontStyle: 'normal',
    textDecoration: '',
    align: 'left',
    fill: '#000000', // Modrá pro odlišení placeholderů
    backgroundColor: 'transparent',
};

/**
 * Výchozí hodnoty pro nový tvar
 */
export const DEFAULT_SHAPE_ELEMENT: Omit<ShapeElement, 'id' | 'x' | 'y' | 'name' | 'shapeType'> = {
    type: 'shape',
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#8B0000', // Tmavě červená
    stroke: '#000000', // Černý okraj
    strokeWidth: 2,
};

/**
 * Výchozí hodnoty pro nový obrázek
 */
export const DEFAULT_IMAGE_ELEMENT: Omit<ImageElement, 'id' | 'x' | 'y' | 'name' | 'src' | 'originalWidth' | 'originalHeight'> = {
    type: 'image',
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
};

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Typ pro aktualizaci prvku - partial update
 */
export type ElementUpdate<T extends CanvasElement = CanvasElement> = Partial<Omit<T, 'id' | 'type'>>;

/**
 * Obecný typ pro aktualizaci libovolného prvku
 * Použití: Když nevíme přesný typ prvku, ale chceme aktualizovat jeho vlastnosti
 * Kombinuje všechny možné vlastnosti ze všech typů prvků
 */
export type AnyElementUpdate =
    | ElementUpdate<TextElement>
    | ElementUpdate<PlaceholderElement>
    | ElementUpdate<ShapeElement>
    | ElementUpdate<ImageElement>;

/**
 * Parametry pro vytvoření nového prvku
 */
export interface CreateElementParams {
    type: ElementType;
    shapeType?: ShapeType;
    placeholderKey?: string;
    imageSrc?: string;
    imageWidth?: number;
    imageHeight?: number;
}

/**
 * Data pro export/uložení šablony
 */
export interface TemplateExportData {
    version: string;
    canvasWidth: number;
    canvasHeight: number;
    elements: CanvasElement[];
    placeholders: string[]; // Seznam klíčů placeholderů
    previewImageUrl: string;
}
