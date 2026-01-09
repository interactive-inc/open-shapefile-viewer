import { useState, useEffect, useCallback, useRef } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  JAPAN_CENTER,
  DEFAULT_ZOOM,
  getPrefecturePosition,
} from "@/lib/prefectures";

// 後方互換性のためre-export
export { PREFECTURES, JAPAN_CENTER, DEFAULT_ZOOM } from "@/lib/prefectures";

export interface MapPosition {
  center: [number, number];
  zoom: number;
}

/** usePrefecture の戻り値型 */
export interface UsePrefectureResult {
  selectedPrefecture: string;
  setSelectedPrefecture: (name: string) => void;
  getInitialPosition: () => MapPosition;
  subscribeToChange: (callback: (position: MapPosition) => void) => () => void;
}

// グローバルなコールバック登録
const changeCallbacks = new Set<(position: MapPosition) => void>();

export function usePrefecture(): UsePrefectureResult {
  const [selectedPrefecture, setSelectedPrefectureState] = useState<string>("");
  const isInitialized = useRef(false);

  // 初回マウント時にlocalStorageから復元
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const saved = localStorage.getItem(STORAGE_KEYS.PREFECTURE);
    if (saved) {
      setSelectedPrefectureState(saved);
    }
  }, []);

  const setSelectedPrefecture = useCallback((name: string) => {
    setSelectedPrefectureState(name);

    // localStorageに保存
    if (name) {
      localStorage.setItem(STORAGE_KEYS.PREFECTURE, name);
    } else {
      localStorage.removeItem(STORAGE_KEYS.PREFECTURE);
    }

    // 地図位置を計算
    const prefPosition = name ? getPrefecturePosition(name) : null;
    const position: MapPosition = prefPosition ?? {
      center: JAPAN_CENTER,
      zoom: DEFAULT_ZOOM,
    };

    // 登録されたコールバックに通知
    for (const callback of changeCallbacks) {
      callback(position);
    }
  }, []);

  const getInitialPosition = useCallback((): MapPosition => {
    const saved = localStorage.getItem(STORAGE_KEYS.PREFECTURE);
    if (saved) {
      const prefPosition = getPrefecturePosition(saved);
      if (prefPosition) {
        return prefPosition;
      }
    }
    return { center: JAPAN_CENTER, zoom: DEFAULT_ZOOM };
  }, []);

  const subscribeToChange = useCallback(
    (callback: (position: MapPosition) => void) => {
      changeCallbacks.add(callback);
      return () => {
        changeCallbacks.delete(callback);
      };
    },
    []
  );

  return {
    selectedPrefecture,
    setSelectedPrefecture,
    getInitialPosition,
    subscribeToChange,
  };
}
