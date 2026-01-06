import { useState } from "react";
import type { Area, AreaWithChildren, AreaProject } from "@/types/area";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AreaTreeView } from "@/components/area/area-tree-view";

interface AreaPanelProps {
  project: AreaProject | null;
  projectPath: string | null;
  isDirty: boolean;
  areaTree: AreaWithChildren[];
  selectedAreaId: string | null;
  isLoading: boolean;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onAddArea: (name: string, parentId?: string | null) => void;
  onRemoveArea: (id: string) => void;
  onUpdateArea: (id: string, updates: Partial<Omit<Area, "id">>) => void;
  onSelectArea: (id: string | null) => void;
}

export function AreaPanel({
  project,
  projectPath,
  isDirty,
  areaTree,
  selectedAreaId,
  isLoading,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onAddArea,
  onRemoveArea,
  onUpdateArea,
  onSelectArea,
}: AreaPanelProps) {
  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [addAsChildOf, setAddAsChildOf] = useState<string | null>(null);

  const handleAddArea = () => {
    if (newAreaName.trim()) {
      onAddArea(newAreaName.trim(), addAsChildOf);
      setNewAreaName("");
      setShowAddArea(false);
      setAddAsChildOf(null);
    }
  };

  const handleAddChild = (parentId: string) => {
    setAddAsChildOf(parentId);
    setShowAddArea(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddArea();
    } else if (e.key === "Escape") {
      setShowAddArea(false);
      setNewAreaName("");
      setAddAsChildOf(null);
    }
  };

  const projectName = projectPath?.split("/").pop()?.replace(".json", "") ?? null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>エリア分類</CardTitle>
        <CardDescription>
          {project ? (
            <>
              {projectName}
              {isDirty && " *"}
            </>
          ) : (
            "プロジェクトを開くか新規作成してください"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Project controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewProject}
            disabled={isLoading}
            className="flex-1"
          >
            新規
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenProject}
            disabled={isLoading}
            className="flex-1"
          >
            開く
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveProject}
            disabled={isLoading || !project || !isDirty}
            className="flex-1"
          >
            保存
          </Button>
        </div>

        {project && (
          <>
            {/* Area tree */}
            <div className="max-h-[250px] overflow-auto border rounded-md p-1">
              <AreaTreeView
                areas={areaTree}
                selectedAreaId={selectedAreaId}
                onSelectArea={onSelectArea}
                onAddChild={handleAddChild}
                onRemoveArea={onRemoveArea}
                onUpdateArea={onUpdateArea}
              />
            </div>

            {/* Add area form */}
            {showAddArea ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={addAsChildOf ? "子エリア名" : "エリア名"}
                  className="flex-1 text-sm px-2 py-1 border rounded"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddArea}>
                  追加
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAddArea(false);
                    setNewAreaName("");
                    setAddAsChildOf(null);
                  }}
                >
                  ✕
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddArea(true)}
                className="w-full"
              >
                + エリア追加
              </Button>
            )}

            {/* Selection info */}
            {selectedAreaId && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                選択中: クリックでフィーチャーを追加
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
