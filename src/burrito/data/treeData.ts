import type { Burrito } from './burritoBuilder';
import type { BurritoWrapper } from './wrapperBuilder';

interface TreeItem {
  id: string;
  label: string;
  children?: TreeItem[];
}

export interface TreeData {
  data: TreeItem[];
  ids: string[];
}

export function mapWrapperToTreeData(
  wrapper: BurritoWrapper | Burrito
): TreeData {
  const keyMap = new Set<string>();
  const getUniqueKey = (key: string, path: string): string => {
    const fullPath = path ? `${path}|${key}` : key;
    if (!keyMap.has(fullPath)) {
      keyMap.add(fullPath);
      return fullPath;
    } else {
      throw new Error(`Duplicate key: ${fullPath}`);
    }
  };

  const mapValueToTreeItem = (
    value: unknown,
    key: string,
    path: string
  ): TreeItem => {
    if (Array.isArray(value)) {
      const id = getUniqueKey(key, path);
      return {
        id,
        label: key,
        children: value.map((item, index) =>
          typeof item === 'object' && item !== null
            ? mapValueToTreeItem(item, `${index}`, id)
            : { id: `${id}|${index}`, label: String(item) }
        ),
      };
    }

    if (typeof value === 'object' && value !== null) {
      const id = getUniqueKey(key, path);
      return {
        id,
        label: key,
        children: Object.entries(value).map(([k, v]) =>
          mapValueToTreeItem(v, k, id)
        ),
      };
    }

    return {
      id: getUniqueKey(key, path),
      label: `${key}: ${String(value)}`,
    };
  };

  const data = Object.entries(wrapper).map(([key, value]) =>
    mapValueToTreeItem(value, key, '')
  );

  return { data, ids: Array.from(keyMap.keys()) };
}
