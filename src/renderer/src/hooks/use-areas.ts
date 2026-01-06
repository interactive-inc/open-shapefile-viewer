import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Area, AreaProject, AreaWithChildren } from "@/types/area";
import {
  AREA_COLORS,
  buildAreaTree,
  createEmptyProject,
  generateAreaId,
} from "@/types/area";

interface UseAreasResult {
  // Project state
  project: AreaProject | null;
  projectPath: string | null;
  isDirty: boolean;

  // Areas
  areas: Area[];
  areaTree: AreaWithChildren[];
  selectedAreaId: string | null;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Project operations
  newProject: () => Promise<void>;
  openProject: () => Promise<void>;
  saveProject: () => Promise<void>;
  saveProjectAs: () => Promise<void>;

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
  areaColorMap: Map<string, string>; // featureId -> color マップ
}

export function useAreas(): UseAreasResult {
  const [project, setProject] = useState<AreaProject | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const isRestoring = useRef(false);

  // 起動時に保存されたプロジェクトパスを復元
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const restoreProject = async () => {
      try {
        const savedPath = await window.electronAPI.loadProjectPath();
        if (!savedPath) return;

        console.log(`[Areas] Restoring project from: ${savedPath}`);
        isRestoring.current = true;
        setIsLoading(true);

        const loadedProject = await window.electronAPI.loadProject(savedPath);
        setProject(loadedProject);
        setProjectPath(savedPath);
        setIsDirty(false);
        console.log(`[Areas] Restored project: ${loadedProject.name}`);
      } catch (e) {
        console.error("[Areas] Failed to restore project:", e);
        // ファイルが見つからない場合は保存パスをクリア
        await window.electronAPI.clearProjectPath();
      } finally {
        setIsLoading(false);
        isRestoring.current = false;
      }
    };

    restoreProject();
  }, []);

  // プロジェクトパス変更時に自動保存 (復元中は除く)
  useEffect(() => {
    if (isRestoring.current) return;
    if (!isInitialized.current) return;

    window.electronAPI.saveProjectPath(projectPath);
  }, [projectPath]);

  // Compute area tree from flat areas
  const areaTree = useMemo(() => {
    if (!project) return [];
    return buildAreaTree(project.areas);
  }, [project]);

  // Create new project
  const newProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filePath = await window.electronAPI.newProjectDialog();
      if (!filePath) {
        setIsLoading(false);
        return;
      }

      const fileName = filePath.split("/").pop()?.replace(".json", "") || "新規プロジェクト";
      const newProj = createEmptyProject(fileName);

      await window.electronAPI.saveProject(filePath, newProj);

      setProject(newProj);
      setProjectPath(filePath);
      setIsDirty(false);
      setSelectedAreaId(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      console.error("Failed to create project:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Open existing project
  const openProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filePath = await window.electronAPI.openProjectDialog();
      if (!filePath) {
        setIsLoading(false);
        return;
      }

      const loadedProject = await window.electronAPI.loadProject(filePath);

      setProject(loadedProject);
      setProjectPath(filePath);
      setIsDirty(false);
      setSelectedAreaId(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      console.error("Failed to open project:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save project
  const saveProject = useCallback(async () => {
    if (!project || !projectPath) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString(),
      };

      await window.electronAPI.saveProject(projectPath, updatedProject);

      setProject(updatedProject);
      setIsDirty(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      console.error("Failed to save project:", e);
    } finally {
      setIsLoading(false);
    }
  }, [project, projectPath]);

  // Save project as new file
  const saveProjectAs = useCallback(async () => {
    if (!project) return;

    setIsLoading(true);
    setError(null);

    try {
      const filePath = await window.electronAPI.newProjectDialog();
      if (!filePath) {
        setIsLoading(false);
        return;
      }

      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString(),
      };

      await window.electronAPI.saveProject(filePath, updatedProject);

      setProject(updatedProject);
      setProjectPath(filePath);
      setIsDirty(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      console.error("Failed to save project:", e);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  // Add new area
  const addArea = useCallback(
    (name: string, parentId: string | null = null) => {
      if (!project) return;

      const newArea: Area = {
        id: generateAreaId(),
        name,
        parentId,
        color: AREA_COLORS[project.areas.length % AREA_COLORS.length],
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

      // Collect all descendant IDs
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

  // Add feature to area (重複チェック: 他のエリアにも割り当て済みなら追加しない)
  const addFeatureToArea = useCallback((areaId: string, featureId: string) => {
    setProject((prev) => {
      if (!prev) return prev;

      // 既に他のエリアに割り当て済みかチェック
      const isAlreadyAssigned = prev.areas.some((a) =>
        a.featureIds.includes(featureId)
      );
      if (isAlreadyAssigned) {
        return prev; // 変更なし
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

  // Add multiple features to area (重複チェック: 他のエリアにも割り当て済みなら追加しない)
  const addFeaturesToArea = useCallback(
    (areaId: string, featureIds: string[]) => {
      setProject((prev) => {
        if (!prev) return prev;

        // 既に割り当て済みのフィーチャーIDを収集
        const assignedIds = new Set<string>();
        for (const area of prev.areas) {
          for (const fid of area.featureIds) {
            assignedIds.add(fid);
          }
        }

        // 未割り当てのフィーチャーのみフィルタ
        const unassignedIds = featureIds.filter((id) => !assignedIds.has(id));
        if (unassignedIds.length === 0) {
          return prev; // 変更なし
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

  // エリア色マップを生成 (featureId -> color)
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
    projectPath,
    isDirty,
    areas: project?.areas ?? [],
    areaTree,
    selectedAreaId,
    isLoading,
    error,
    areaColorMap,
    newProject,
    openProject,
    saveProject,
    saveProjectAs,
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
