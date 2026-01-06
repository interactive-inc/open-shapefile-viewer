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
  projectName: string | null;
  isDirty: boolean;
  areaTree: AreaWithChildren[];
  selectedAreaId: string | null;
  isLoading: boolean;
  onNewProject: (name: string) => void;
  onOpenProject: () => void;
  onDownloadProject: () => void;
  onCloseProject: () => void;
  onAddArea: (name: string, parentId?: string | null) => void;
  onRemoveArea: (id: string) => void;
  onUpdateArea: (id: string, updates: Partial<Omit<Area, "id">>) => void;
  onSelectArea: (id: string | null) => void;
}

export function AreaPanel({
  project,
  projectName,
  isDirty,
  areaTree,
  selectedAreaId,
  isLoading,
  onNewProject,
  onOpenProject,
  onDownloadProject,
  onCloseProject,
  onAddArea,
  onRemoveArea,
  onUpdateArea,
  onSelectArea,
}: AreaPanelProps) {
  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [addAsChildOf, setAddAsChildOf] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

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

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onNewProject(newProjectName.trim());
      setNewProjectName("");
      setShowNewProject(false);
    }
  };

  const handleNewProjectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateProject();
    } else if (e.key === "Escape") {
      setShowNewProject(false);
      setNewProjectName("");
    }
  };

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
        {/* New project form */}
        {showNewProject ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={handleNewProjectKeyDown}
              placeholder="プロジェクト名"
              className="flex-1 text-sm px-2 py-1 border rounded"
              autoFocus
            />
            <Button size="sm" onClick={handleCreateProject}>
              作成
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNewProject(false);
                setNewProjectName("");
              }}
            >
              ✕
            </Button>
          </div>
        ) : (
          /* Project controls */
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewProject(true)}
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
              onClick={onDownloadProject}
              disabled={isLoading || !project}
              className="flex-1"
            >
              保存
            </Button>
          </div>
        )}

        {project && (
          <>
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCloseProject}
              className="w-full text-muted-foreground"
            >
              プロジェクトを閉じる
            </Button>

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
