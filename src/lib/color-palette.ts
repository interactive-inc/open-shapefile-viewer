/**
 * アプリ全体の色管理
 *
 * HSL色空間を使用して、色相を均等に分散させた色を生成
 * 既存の色から最も離れた色を選択することで、近い色を避ける
 */

// UI状態の色 (予約済み - ポリゴン色として使用不可)
export const UI_COLORS = {
  selected: "#22c55e", // 選択状態 (緑)
  hoverAdd: "#22c55e", // ホバー追加可能 (緑)
  hoverRemove: "#ef4444", // ホバー削除可能 (赤)
  hoverDisabled: "#9ca3af", // ホバー変更不可 (グレー)
  unassigned: "#9ca3af", // エリア未割当 (グレー)
} as const;

// 予約済み色のHSL値 (これらに近い色は避ける)
const RESERVED_HUES = [
  120, // 緑 (#22c55e) - 選択/追加可能
  0, // 赤 (#ef4444) - 削除可能
];

/**
 * HSL色空間で均等に分散した色パレットを生成
 * 予約済み色相を避けて生成
 */
function generateDistributedPalette(count: number): string[] {
  const colors: string[] = [];
  const saturation = 70; // 彩度
  const lightness = 55; // 明度

  // 予約済み色相から離れた開始位置を計算
  const reservedBuffer = 30; // 予約色から30度離れる
  const availableHues: number[] = [];

  // 利用可能な色相を収集 (予約済みから離れた範囲)
  for (let h = 0; h < 360; h += 5) {
    const isNearReserved = RESERVED_HUES.some((reserved) => {
      const diff = Math.abs(h - reserved);
      return Math.min(diff, 360 - diff) < reservedBuffer;
    });
    if (!isNearReserved) {
      availableHues.push(h);
    }
  }

  // 利用可能な色相から均等に選択
  const step = Math.floor(availableHues.length / count);
  for (let i = 0; i < count; i++) {
    const hueIndex = (i * step) % availableHues.length;
    const hue = availableHues[hueIndex];
    colors.push(hslToHex(hue, saturation, lightness));
  }

  return colors;
}

/**
 * HSLをHEXに変換
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * HEXをHSLに変換 (色相のみ取得)
 */
function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return h;
}

/**
 * 2つの色相間の距離を計算 (0-180)
 */
function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

// 事前生成したパレット (12色)
export const POLYGON_PALETTE = generateDistributedPalette(12);

/**
 * 使用済み色から最も離れた色を取得
 */
export function getNextAvailableColor(usedColors: string[]): string {
  if (usedColors.length === 0) {
    return POLYGON_PALETTE[0];
  }

  // 使用済み色の色相を取得
  const usedHues = usedColors.map(hexToHue);

  // パレットから最も離れた色を選択
  let bestColor = POLYGON_PALETTE[0];
  let bestMinDistance = 0;

  for (const color of POLYGON_PALETTE) {
    // 既に使用されている場合はスキップ
    if (usedColors.includes(color)) continue;

    const hue = hexToHue(color);
    const minDistance = Math.min(...usedHues.map((used) => hueDistance(hue, used)));

    if (minDistance > bestMinDistance) {
      bestMinDistance = minDistance;
      bestColor = color;
    }
  }

  // パレットが枯渇した場合は新しい色を生成
  if (usedColors.includes(bestColor)) {
    const newHue = (usedHues.reduce((a, b) => a + b, 0) / usedHues.length + 180) % 360;
    return hslToHex(newHue, 70, 55);
  }

  return bestColor;
}

/**
 * インデックスベースで色を取得 (後方互換性用)
 */
export function getColorByIndex(index: number): string {
  return POLYGON_PALETTE[index % POLYGON_PALETTE.length];
}
