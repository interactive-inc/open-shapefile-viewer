import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Area, AreaProject, AreaWithChildren } from "@/types/area";
import {
  buildAreaTree,
  createEmptyProject,
  generateAreaId,
  getNextAvailableColor,
} from "@/types/area";
import type { Layer } from "@/types/layer";
import { getFeatureNameFromLayers } from "@/types/layer";
import { STORAGE_KEYS } from "@/lib/constants";
import { projectLogger } from "@/lib/logger";

interface UseAreasResult {
  // Project state
  project: AreaProject | null;
  projectName: string | null;
  isDirty: boolean;

  // Areas
  areas: Area[];
  areaTree: AreaWithChildren[];
  selectedAreaId: string | null;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Project operations
  newProject: (name: string) => void;
  openProjectFromFile: (file: File) => Promise<void>;
  downloadProject: (layers: Layer[]) => void;
  closeProject: () => void;

  // Area operations
  addArea: (name: string, parentId?: string | null) => void;
  removeArea: (id: string) => void;
  updateArea: (id: string, updates: Partial<Omit<Area, "id">>) => void;
  selectArea: (id: string | null) => void;

  // Feature operations
  addFeatureToArea: (areaId: string, featureId: string) => void;
  removeFeatureFromArea: (areaId: string, featureId: string) => void;
  addFeaturesToArea: (areaId: string, featureIds: string[]) => void;

  // Utils
  getAreaById: (id: string) => Area | undefined;
  getAreaColor: (featureId: string) => string | null;
  areaColorMap: Map<string, string>;
}

/**
 * プロジェクトをJSONファイルとしてダウンロード
 */
function downloadProjectAsFile(project: AreaProject) {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useAreas(): UseAreasResult {
  const [project, setProject] = useState<AreaProject | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // 起動時にlocalStorageからプロジェクトを復元
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECT);
      if (saved) {
        const loadedProject = JSON.parse(saved) as AreaProject;
        setProject(loadedProject);
        projectLogger.log(`Restored from localStorage: ${loadedProject.name}`);
      }
    } catch (e) {
      console.error("[Project] Failed to restore from localStorage:", e);
    }
  }, []);

  // プロジェクト変更時にlocalStorageに自動保存
  useEffect(() => {
    if (!isInitialized.current) return;

    if (project) {
      try {
        localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project));
      } catch (e) {
        console.error("[Project] Failed to save to localStorage:", e);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.PROJECT);
      } catch (e) {
        console.error("[Project] Failed to clear localStorage:", e);
      }
    }
  }, [project]);

  // Compute area tree from flat areas
  const areaTree = useMemo(() => {
    if (!project) return [];
    return buildAreaTree(project.areas);
  }, [project]);

  // Create new project
  const newProject = useCallback((name: string) => {
    const newProj = createEmptyProject(name);
    setProject(newProj);
    setIsDirty(false);
    setSelectedAreaId(null);
    setError(null);
  }, []);

  // Open project from file
  const openProjectFromFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const loadedProject = JSON.parse(text) as AreaProject;

      // バリデーション
      if (!loadedProject.name || !loadedProject.areas) {
        throw new Error("無効なプロジェクトファイルです");
      }

      setProject(loadedProject);
      setIsDirty(false);
      setSelectedAreaId(null);
      projectLogger.log(`Loaded: ${loadedProject.name}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      console.error("Failed to open project:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Download project as JSON file
  const downloadProject = useCallback(
    (layers: Layer[]) => {
      if (!project) return;

      // 各エリアのフィーチャー名を生成
      const areasWithNames = project.areas.map((area) => {
        const featureNames: Record<string, string> = {};
        for (const featureId of area.featureIds) {
          const name = getFeatureNameFromLayers(featureId, layers);
          if (name) {
            featureNames[featureId] = name;
          }
        }
        return {
          ...area,
          featureNames: Object.keys(featureNames).length > 0 ? featureNames : undefined,
        };
      });

      const updatedProject: AreaProject = {
        ...project,
        areas: areasWithNames,
        updatedAt: new Date().toISOString(),
      };

      setProject(updatedProject);
      setIsDirty(false);
      downloadProjectAsFile(updatedProject);
    },
    [project]
  );

  // Close project
  const closeProject = useCallback(() => {
    setProject(null);
    setIsDirty(false);
    setSelectedAreaId(null);
    setError(null);
  }, []);

  // Add new area
  const addArea = useCallback(
    (name: string, parentId: string | null = null) => {
      if (!project) return;

      // 既存エリアの色を取得
      const usedColors = project.areas.map((a) => a.color);
      // 使用済み色から最も離れた色を選択
      const newColor = getNextAvailableColor(usedColors);

      const newArea: Area = {
        id: generateAreaId(),
        name,
        parentId,
        color: newColor,
        featureIds: [],
      };

      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          areas: [...prev.areas, newArea],
        };
      });
      setIsDirty(true);
    },
    [project]
  );

  // Remove area and its children
  const removeArea = useCallback((id: string) => {
    setProject((prev) => {
      if (!prev) return prev;

      const idsToRemove = new Set<string>();
      const collectDescendants = (areaId: string) => {
        idsToRemove.add(areaId);
        for (const area of prev.areas) {
          if (area.parentId === areaId) {
            collectDescendants(area.id);
          }
        }
      };
      collectDescendants(id);

      return {
        ...prev,
        areas: prev.areas.filter((a) => !idsToRemove.has(a.id)),
      };
    });
    setIsDirty(true);
    setSelectedAreaId((prev) => (prev === id ? null : prev));
  }, []);

  // Update area
  const updateArea = useCallback(
    (id: string, updates: Partial<Omit<Area, "id">>) => {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          areas: prev.areas.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        };
      });
      setIsDirty(true);
    },
    []
  );

  // Select area
  const selectArea = useCallback((id: string | null) => {
    setSelectedAreaId(id);
  }, []);

  // Add feature to area
  const addFeatureToArea = useCallback((areaId: string, featureId: string) => {
    setProject((prev) => {
      if (!prev) return prev;

      const isAlreadyAssigned = prev.areas.some((a) =>
        a.featureIds.includes(featureId)
      );
      if (isAlreadyAssigned) {
        return prev;
      }

      return {
        ...prev,
        areas: prev.areas.map((a) =>
          a.id === areaId
            ? { ...a, featureIds: [...a.featureIds, featureId] }
            : a
        ),
      };
    });
    setIsDirty(true);
  }, []);

  // Remove feature from area
  const removeFeatureFromArea = useCallback(
    (areaId: string, featureId: string) => {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          areas: prev.areas.map((a) =>
            a.id === areaId
              ? { ...a, featureIds: a.featureIds.filter((f) => f !== featureId) }
              : a
          ),
        };
      });
      setIsDirty(true);
    },
    []
  );

  // Add multiple features to area
  const addFeaturesToArea = useCallback(
    (areaId: string, featureIds: string[]) => {
      setProject((prev) => {
        if (!prev) return prev;

        const assignedIds = new Set<string>();
        for (const area of prev.areas) {
          for (const fid of area.featureIds) {
            assignedIds.add(fid);
          }
        }

        const unassignedIds = featureIds.filter((id) => !assignedIds.has(id));
        if (unassignedIds.length === 0) {
          return prev;
        }

        return {
          ...prev,
          areas: prev.areas.map((a) =>
            a.id === areaId
              ? { ...a, featureIds: [...a.featureIds, ...unassignedIds] }
              : a
          ),
        };
      });
      setIsDirty(true);
    },
    []
  );

  // Get area by ID
  const getAreaById = useCallback(
    (id: string): Area | undefined => {
      return project?.areas.find((a) => a.id === id);
    },
    [project]
  );

  // Get area color for a feature
  const getAreaColor = useCallback(
    (featureId: string): string | null => {
      if (!project) return null;
      const area = project.areas.find((a) => a.featureIds.includes(featureId));
      return area?.color ?? null;
    },
    [project]
  );

  // Area color map
  const areaColorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!project) return map;
    for (const area of project.areas) {
      for (const featureId of area.featureIds) {
        map.set(featureId, area.color);
      }
    }
    return map;
  }, [project]);

  return {
    project,
    projectName: project?.name ?? null,
    isDirty,
    areas: project?.areas ?? [],
    areaTree,
    selectedAreaId,
    isLoading,
    error,
    areaColorMap,
    newProject,
    openProjectFromFile,
    downloadProject,
    closeProject,
    addArea,
    removeArea,
    updateArea,
    selectArea,
    addFeatureToArea,
    removeFeatureFromArea,
    addFeaturesToArea,
    getAreaById,
    getAreaColor,
  };
}
