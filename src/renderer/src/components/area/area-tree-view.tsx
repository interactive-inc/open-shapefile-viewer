import { useState } from "react";
import type { AreaWithChildren, Area } from "@/types/area";
import { AREA_COLORS } from "@/types/area";

interface AreaTreeViewProps {
  areas: AreaWithChildren[];
  selectedAreaId: string | null;
  onSelectArea: (id: string | null) => void;
  onAddChild: (parentId: string) => void;
  onRemoveArea: (id: string) => void;
  onUpdateArea: (id: string, updates: Partial<Omit<Area, "id">>) => void;
}

interface AreaTreeItemProps {
  area: AreaWithChildren;
  depth: number;
  selectedAreaId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectArea: (id: string | null) => void;
  onAddChild: (parentId: string) => void;
  onRemoveArea: (id: string) => void;
  onUpdateArea: (id: string, updates: Partial<Omit<Area, "id">>) => void;
}

function AreaTreeItem({
  area,
  depth,
  selectedAreaId,
  expandedIds,
  onToggleExpand,
  onSelectArea,
  onAddChild,
  onRemoveArea,
  onUpdateArea,
}: AreaTreeItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(area.name);

  const isExpanded = expandedIds.has(area.id);
  const isSelected = selectedAreaId === area.id;
  const hasChildren = area.children.length > 0;

  const handleClick = () => {
    // 同じエリアをクリックしたら選択解除 (トグル)
    const currentlySelected = selectedAreaId === area.id;
    onSelectArea(currentlySelected ? null : area.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(area.id);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(area.name);
  };

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== area.name) {
      onUpdateArea(area.id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditName(area.name);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-accent ${
          isSelected ? "bg-accent" : ""
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          className="w-4 h-4 flex items-center justify-center text-xs"
          onClick={handleToggle}
        >
          {hasChildren ? (isExpanded ? "▼" : "▶") : ""}
        </button>

        {/* Color indicator */}
        <div className="relative">
          <div
            className="w-3 h-3 rounded-sm border"
            style={{ backgroundColor: area.color }}
          />
          <select
            className="absolute inset-0 opacity-0 cursor-pointer"
            value={area.color}
            onChange={(e) => {
              e.stopPropagation();
              onUpdateArea(area.id, { color: e.target.value });
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {AREA_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm px-1 border rounded"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`flex-1 text-sm truncate cursor-pointer ${
              isSelected ? "font-semibold text-primary" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleDoubleClick();
            }}
          >
            {area.name}
          </span>
        )}

        {/* Feature count */}
        <span className="text-xs text-muted-foreground">
          {area.featureIds.length}
        </span>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            className="text-xs px-1 hover:bg-background rounded"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(area.id);
            }}
            title="子エリア追加"
          >
            +
          </button>
          <button
            type="button"
            className="text-xs px-1 text-destructive hover:bg-background rounded"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveArea(area.id);
            }}
            title="削除"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {area.children.map((child) => (
            <AreaTreeItem
              key={`${child.id}-${selectedAreaId === child.id}`}
              area={child}
              depth={depth + 1}
              selectedAreaId={selectedAreaId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelectArea={onSelectArea}
              onAddChild={onAddChild}
              onRemoveArea={onRemoveArea}
              onUpdateArea={onUpdateArea}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AreaTreeView({
  areas,
  selectedAreaId,
  onSelectArea,
  onAddChild,
  onRemoveArea,
  onUpdateArea,
}: AreaTreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (areas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        エリアがありません
      </p>
    );
  }

  return (
    <div className="space-y-0.5 group">
      {areas.map((area) => (
        <AreaTreeItem
          key={`${area.id}-${selectedAreaId === area.id}`}
          area={area}
          depth={0}
          selectedAreaId={selectedAreaId}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          onSelectArea={onSelectArea}
          onAddChild={onAddChild}
          onRemoveArea={onRemoveArea}
          onUpdateArea={onUpdateArea}
        />
      ))}
    </div>
  );
}
