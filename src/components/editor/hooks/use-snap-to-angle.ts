/**
 * Hook pro rotation snap - DEPRECATED
 *
 * Konva Transformer má vestavěnou podporu pro rotation snaps.
 * Tento hook již není potřeba - použijte přímo Transformer props:
 *
 * @example
 * <Transformer
 *   rotationSnaps={[0, 90, 180, 270]}
 *   rotationSnapTolerance={5}
 * />
 *
 * @see https://konvajs.org/docs/select_and_transform/Transform_Rotation_Snaps.html
 */

/**
 * Výchozí úhly pro snapping
 */
export const ROTATION_SNAP_ANGLES = [0, 90, 180, 270];

/**
 * Výchozí tolerance pro snapping (ve stupních)
 */
export const ROTATION_SNAP_TOLERANCE = 5;

/**
 * Pomocná funkce pro normalizaci úhlu do rozsahu 0-360
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Pomocná funkce pro manuální snap úhlu (pokud nepoužíváte Transformer)
 *
 * @param angle - Úhel ke snapnutí
 * @param snapAngles - Pole úhlů pro snap (default: [0, 90, 180, 270])
 * @param tolerance - Tolerance ve stupních (default: 5)
 * @returns Snapnutý úhel nebo původní úhel
 */
export function snapAngle(
  angle: number,
  snapAngles: number[] = ROTATION_SNAP_ANGLES,
  tolerance: number = ROTATION_SNAP_TOLERANCE,
): number {
  const normalized = normalizeAngle(angle);

  for (const snapAngle of snapAngles) {
    const normalizedSnap = normalizeAngle(snapAngle);
    const diff = Math.abs(normalized - normalizedSnap);
    const adjustedDiff = Math.min(diff, 360 - diff);

    if (adjustedDiff <= tolerance) {
      return normalizedSnap === 360 ? 0 : normalizedSnap;
    }
  }

  return normalized;
}

/**
 * @deprecated Použijte Konva Transformer s rotationSnaps prop
 *
 * Tento hook zůstává pro zpětnou kompatibilitu, ale doporučujeme
 * použít vestavěnou funkcionalitu Transformeru.
 */
export function useSnapToAngle() {
  console.warn(
    "useSnapToAngle is deprecated. Use Konva Transformer with rotationSnaps prop instead.",
  );

  return {
    snapRotation: snapAngle,
    normalizeAngle,
    snapAngles: ROTATION_SNAP_ANGLES,
    tolerance: ROTATION_SNAP_TOLERANCE,
  };
}
