import { useState, useMemo, useCallback } from "react";
import type { Feature, Geometry, GeoJsonProperties } from "geojson";
import {
  getAvailablePropertyKeys,
  getAvailablePropertyValues,
} from "@/lib/property-filter-utils";

interface PropertyMultiSelectProps {
  features: Feature<Geometry | null, GeoJsonProperties>[];
  selectedKey: string;
  selectedValues: Set<string>;
  onKeyChange: (key: string) => void;
  onValuesChange: (values: Set<string>) => void;
  keyLabel?: string;
  valuesLabel?: string;
}

export function PropertyMultiSelect({
  features,
  selectedKey,
  selectedValues,
  onKeyChange,
  onValuesChange,
  keyLabel = "属性",
  valuesLabel = "値 (OR条件)",
}: PropertyMultiSelectProps) {
  const [searchText, setSearchText] = useState("");

  const availableKeys = useMemo(
    () => getAvailablePropertyKeys(features),
    [features]
  );

  const availableValues = useMemo(
    () => getAvailablePropertyValues(features, selectedKey),
    [features, selectedKey]
  );

  // 検索テキストでフィルタリングされた値
  const filteredValues = useMemo(() => {
    if (!searchText.trim()) return availableValues;
    const lowerSearch = searchText.toLowerCase();
    return availableValues.filter((value) =>
      value.toLowerCase().includes(lowerSearch)
    );
  }, [availableValues, searchText]);

  const handleKeyChange = useCallback(
    (key: string) => {
      onKeyChange(key);
      onValuesChange(new Set()); // キー変更時は値をリセット
      setSearchText(""); // 検索テキストもリセット
    },
    [onKeyChange, onValuesChange]
  );

  const handleValueToggle = useCallback(
    (value: string) => {
      const next = new Set(selectedValues);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      onValuesChange(next);
    },
    [selectedValues, onValuesChange]
  );

  // フィルタされた値を全選択 (既存の選択を保持しつつ追加)
  const handleSelectFiltered = useCallback(() => {
    const next = new Set(selectedValues);
    for (const value of filteredValues) {
      next.add(value);
    }
    onValuesChange(next);
  }, [selectedValues, filteredValues, onValuesChange]);

  // フィルタされた値を全解除 (他の選択は保持)
  const handleDeselectFiltered = useCallback(() => {
    const filteredSet = new Set(filteredValues);
    const next = new Set(
      [...selectedValues].filter((v) => !filteredSet.has(v))
    );
    onValuesChange(next);
  }, [selectedValues, filteredValues, onValuesChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{keyLabel}</label>
        <select
          className="w-full text-sm border rounded px-2 py-1"
          value={selectedKey}
          onChange={(e) => handleKeyChange(e.target.value)}
        >
          <option value="">選択してください</option>
          {availableKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      {selectedKey && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">
              {valuesLabel} - {selectedValues.size}/{availableValues.length}
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleSelectFiltered}
                className="text-xs text-primary hover:underline"
              >
                全選択
              </button>
              <span className="text-xs text-muted-foreground">/</span>
              <button
                type="button"
                onClick={handleDeselectFiltered}
                className="text-xs text-primary hover:underline"
              >
                全解除
              </button>
            </div>
          </div>
          {/* 検索入力 */}
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="値を検索..."
              className="w-full text-sm border rounded px-2 py-1 pr-7"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="検索をクリア"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-auto border rounded p-2 space-y-1">
            {filteredValues.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                該当なし
              </p>
            ) : (
              filteredValues.map((value) => (
                <label
                  key={value}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.has(value)}
                    onChange={() => handleValueToggle(value)}
                    className="rounded"
                  />
                  <span className="truncate">{value}</span>
                </label>
              ))
            )}
          </div>
          {searchText && (
            <p className="text-xs text-muted-foreground">
              {filteredValues.length}/{availableValues.length} 件表示中
            </p>
          )}
        </div>
      )}
    </div>
  );
}
