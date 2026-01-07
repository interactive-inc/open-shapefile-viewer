/**
 * FileList モックのヘルパー関数
 * テストで FileList を作成する際の重複コードを削減
 */

/**
 * File配列からFileListモックを作成する
 */
export function createMockFileList(...files: File[]): FileList {
  const fileList: Record<number, File> & {
    length: number;
    item: (index: number) => File | null;
    [Symbol.iterator]: () => IterableIterator<File>;
  } = {
    length: files.length,
    item: (index: number): File | null => files[index] ?? null,
    [Symbol.iterator]: function* (): IterableIterator<File> {
      for (const file of files) {
        yield file;
      }
    },
  };

  // インデックスアクセスを追加
  files.forEach((file, index) => {
    fileList[index] = file;
  });

  return fileList as unknown as FileList;
}

/**
 * 有効な Shapefile セット (shp + dbf) を持つ FileList を作成
 */
export function createShapefileFileList(name = "test"): {
  fileList: FileList;
  shpFile: File;
  dbfFile: File;
} {
  const shpFile = new File([""], `${name}.shp`, { type: "" });
  const dbfFile = new File([""], `${name}.dbf`, { type: "" });
  return {
    fileList: createMockFileList(shpFile, dbfFile),
    shpFile,
    dbfFile,
  };
}

/**
 * 単一の shp ファイルのみを持つ FileList を作成
 */
export function createSingleShpFileList(name = "test"): {
  fileList: FileList;
  shpFile: File;
} {
  const shpFile = new File([""], `${name}.shp`, { type: "" });
  return {
    fileList: createMockFileList(shpFile),
    shpFile,
  };
}

/**
 * 無効なファイル (txt など) を持つ FileList を作成
 */
export function createInvalidFileList(name = "test.txt"): FileList {
  return createMockFileList(new File([""], name));
}
