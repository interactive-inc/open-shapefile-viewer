/**
 * FileList モックのヘルパー関数
 * テストで FileList を作成する際の重複コードを削減
 */

/**
 * テスト用 FileList 互換インターフェース
 * ブラウザの FileList は直接インスタンス化できないため、
 * テスト環境用に互換性のあるモックを提供する
 */
export interface MockFileList extends Iterable<File> {
  readonly length: number;
  item(index: number): File | null;
  readonly [index: number]: File;
}

/**
 * MockFileList を FileList 型として返すヘルパー
 * テスト対象コードが FileList 型を期待する場合に使用
 *
 * @remarks
 * FileList はブラウザ API であり、テスト環境では直接作成できないため、
 * 互換性のあるオブジェクトを型アサーションで返す。
 * この型アサーションはテストユーティリティに限定して使用し、
 * プロダクションコードでは使用しないこと。
 */
function asMockFileList(mock: MockFileList): FileList {
  // テスト環境専用: FileList API を完全に実装したモックオブジェクト
  return mock as FileList;
}

/**
 * File配列からFileListモックを作成する
 */
export function createMockFileList(...files: File[]): FileList {
  const mockFileList: MockFileList = {
    length: files.length,
    item: (index: number): File | null => files[index] ?? null,
    [Symbol.iterator]: function* (): IterableIterator<File> {
      for (const file of files) {
        yield file;
      }
    },
    // インデックスアクセスを追加
    ...Object.fromEntries(files.map((file, index) => [index, file])),
  } as MockFileList;

  return asMockFileList(mockFileList);
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
