import { useState, useEffect, useCallback, useRef } from "react";

const PREFECTURE_STORAGE_KEY = "shapefile-viewer-prefecture";

// 日本全体の中心座標
export const JAPAN_CENTER: [number, number] = [36.5, 138.0];
export const DEFAULT_ZOOM = 5;

// 都道府県データ (名前, 緯度, 経度, ズーム)
export const PREFECTURES: {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}[] = [
  { name: "北海道", lat: 43.06, lng: 141.35, zoom: 7 },
  { name: "青森県", lat: 40.82, lng: 140.74, zoom: 9 },
  { name: "岩手県", lat: 39.7, lng: 141.15, zoom: 8 },
  { name: "宮城県", lat: 38.27, lng: 140.87, zoom: 9 },
  { name: "秋田県", lat: 39.72, lng: 140.1, zoom: 9 },
  { name: "山形県", lat: 38.24, lng: 140.34, zoom: 9 },
  { name: "福島県", lat: 37.75, lng: 140.47, zoom: 8 },
  { name: "茨城県", lat: 36.34, lng: 140.45, zoom: 9 },
  { name: "栃木県", lat: 36.57, lng: 139.88, zoom: 9 },
  { name: "群馬県", lat: 36.39, lng: 139.06, zoom: 9 },
  { name: "埼玉県", lat: 35.86, lng: 139.65, zoom: 9 },
  { name: "千葉県", lat: 35.6, lng: 140.12, zoom: 9 },
  { name: "東京都", lat: 35.69, lng: 139.69, zoom: 10 },
  { name: "神奈川県", lat: 35.45, lng: 139.64, zoom: 9 },
  { name: "新潟県", lat: 37.9, lng: 139.02, zoom: 8 },
  { name: "富山県", lat: 36.7, lng: 137.21, zoom: 9 },
  { name: "石川県", lat: 36.59, lng: 136.63, zoom: 9 },
  { name: "福井県", lat: 36.07, lng: 136.22, zoom: 9 },
  { name: "山梨県", lat: 35.66, lng: 138.57, zoom: 9 },
  { name: "長野県", lat: 36.65, lng: 138.18, zoom: 8 },
  { name: "岐阜県", lat: 35.39, lng: 136.72, zoom: 8 },
  { name: "静岡県", lat: 34.98, lng: 138.38, zoom: 8 },
  { name: "愛知県", lat: 35.18, lng: 136.91, zoom: 9 },
  { name: "三重県", lat: 34.73, lng: 136.51, zoom: 9 },
  { name: "滋賀県", lat: 35.0, lng: 135.87, zoom: 9 },
  { name: "京都府", lat: 35.02, lng: 135.76, zoom: 9 },
  { name: "大阪府", lat: 34.69, lng: 135.52, zoom: 10 },
  { name: "兵庫県", lat: 34.69, lng: 135.18, zoom: 8 },
  { name: "奈良県", lat: 34.69, lng: 135.83, zoom: 9 },
  { name: "和歌山県", lat: 34.23, lng: 135.17, zoom: 9 },
  { name: "鳥取県", lat: 35.5, lng: 134.24, zoom: 9 },
  { name: "島根県", lat: 35.47, lng: 133.05, zoom: 8 },
  { name: "岡山県", lat: 34.66, lng: 133.93, zoom: 9 },
  { name: "広島県", lat: 34.4, lng: 132.46, zoom: 9 },
  { name: "山口県", lat: 34.19, lng: 131.47, zoom: 9 },
  { name: "徳島県", lat: 34.07, lng: 134.56, zoom: 9 },
  { name: "香川県", lat: 34.34, lng: 134.04, zoom: 10 },
  { name: "愛媛県", lat: 33.84, lng: 132.77, zoom: 9 },
  { name: "高知県", lat: 33.56, lng: 133.53, zoom: 8 },
  { name: "福岡県", lat: 33.59, lng: 130.4, zoom: 9 },
  { name: "佐賀県", lat: 33.25, lng: 130.3, zoom: 10 },
  { name: "長崎県", lat: 32.74, lng: 129.87, zoom: 9 },
  { name: "熊本県", lat: 32.79, lng: 130.74, zoom: 9 },
  { name: "大分県", lat: 33.24, lng: 131.61, zoom: 9 },
  { name: "宮崎県", lat: 31.91, lng: 131.42, zoom: 9 },
  { name: "鹿児島県", lat: 31.56, lng: 130.56, zoom: 8 },
  { name: "沖縄県", lat: 26.21, lng: 127.68, zoom: 9 },
];

export interface MapPosition {
  center: [number, number];
  zoom: number;
}

interface UsePrefectureResult {
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

    const saved = localStorage.getItem(PREFECTURE_STORAGE_KEY);
    if (saved) {
      setSelectedPrefectureState(saved);
    }
  }, []);

  const setSelectedPrefecture = useCallback((name: string) => {
    setSelectedPrefectureState(name);

    // localStorageに保存
    if (name) {
      localStorage.setItem(PREFECTURE_STORAGE_KEY, name);
    } else {
      localStorage.removeItem(PREFECTURE_STORAGE_KEY);
    }

    // 地図位置を計算
    let position: MapPosition;
    if (!name) {
      position = { center: JAPAN_CENTER, zoom: DEFAULT_ZOOM };
    } else {
      const pref = PREFECTURES.find((p) => p.name === name);
      if (pref) {
        position = { center: [pref.lat, pref.lng], zoom: pref.zoom };
      } else {
        position = { center: JAPAN_CENTER, zoom: DEFAULT_ZOOM };
      }
    }

    // 登録されたコールバックに通知
    for (const callback of changeCallbacks) {
      callback(position);
    }
  }, []);

  const getInitialPosition = useCallback((): MapPosition => {
    const saved = localStorage.getItem(PREFECTURE_STORAGE_KEY);
    if (saved) {
      const pref = PREFECTURES.find((p) => p.name === saved);
      if (pref) {
        return { center: [pref.lat, pref.lng], zoom: pref.zoom };
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
