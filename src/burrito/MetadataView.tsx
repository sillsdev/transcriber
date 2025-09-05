import { RichTreeView } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { BurritoWrapper } from './data/wrapperBuilder';
import { mapWrapperToTreeData } from './data/treeData';
import type { TreeData } from './data/treeData';
import React, { useState, useEffect } from 'react';
import MetaValue from './MetaValue';
import type { Burrito } from './data/burritoBuilder';

interface MetadataViewProps {
  wrapper: BurritoWrapper | Burrito;
}

export function MetadataView({ wrapper }: MetadataViewProps) {
  const [MetaValueOpen, setMetaValueOpen] = useState(false);
  const [MetaValueKey, setMetaValueKey] = useState('');
  const [MetaValueValue, setMetaValueValue] = useState('');
  const [treeData, setTreeData] = useState<TreeData>({ data: [], ids: [] });
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  function findNode(
    arg: Record<string, unknown>,
    keys: string
  ): unknown | null {
    let node = arg;
    for (const key of keys.split('|').slice(0, -1)) {
      if (typeof node === 'object' && node !== null) {
        node = node[key] as Record<string, unknown>;
      }
    }
    return node;
  }

  function handleItemClick(
    _event: React.MouseEvent<Element>,
    itemId: string
  ): void {
    const id = itemId.split('|').pop() as string;
    const node = findNode(
      wrapper as unknown as Record<string, unknown>,
      itemId
    );
    const value = (node as Record<string, unknown>)[id];
    if (typeof value === 'object') {
      if (expandedItems.includes(itemId)) {
        setExpandedItems(expandedItems.filter((id) => id !== itemId));
      } else {
        setExpandedItems([...expandedItems, itemId]);
      }
      return;
    }
    setMetaValueKey(itemId);
    setMetaValueValue(value as string);
    setMetaValueOpen(true);
  }

  function handleValueConfirm(key: string, value: unknown): void {
    const node = findNode(wrapper as unknown as Record<string, unknown>, key);
    const id = key.split('|').pop() as string;
    (node as Record<string, unknown>)[id] = value;
    setTreeData(mapWrapperToTreeData(wrapper));
  }

  useEffect(() => {
    const treeData = mapWrapperToTreeData(wrapper);
    setTreeData(treeData);
    setExpandedItems(treeData.ids);
  }, [wrapper]);

  return (
    <>
      <RichTreeView
        items={treeData.data}
        onItemClick={handleItemClick}
        expandedItems={expandedItems}
        slots={{
          expandIcon: ChevronRightIcon,
          collapseIcon: ExpandMoreIcon,
        }}
        sx={{
          height: '100%',
          flexGrow: 1,
          maxWidth: '100%',
          overflowY: 'auto',
        }}
      />
      <MetaValue
        idKey={MetaValueKey}
        value={MetaValueValue}
        onConfirm={handleValueConfirm}
        isOpen={MetaValueOpen}
        onOpen={(isOpen) => setMetaValueOpen(isOpen)}
      />
    </>
  );
}
