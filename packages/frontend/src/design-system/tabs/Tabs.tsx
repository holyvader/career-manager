'use client';

import { cx } from '@ds/utils/cx';
import { Fragment, type ReactNode, useId, useState } from 'react';

export interface TabItem<T extends string> {
  id: T;
  disabled?: boolean;
  title: string;
  content: ReactNode;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  defaultTabId?: T;
  variant?: 'lift' | 'box';
  grow?: boolean;
}

const tabsVariants = {
  lift: 'd-tabs d-tabs-lift',
  box: 'd-tabs d-tabs-box mb-4',
};

export function Tabs<T extends string>({
  items,
  defaultTabId,
  variant = 'lift',
  grow = false,
}: TabsProps<T>) {
  const name = useId();
  const [activeId, setActiveId] = useState<T | undefined>(
    defaultTabId ?? items[0]?.id,
  );

  return (
    <Fragment>
      <div className={tabsVariants[variant]}>
        {items.map((item) => (
          <input
            key={item.id}
            type="radio"
            name={name}
            className={cx(
              'd-tab',
              item.id === activeId && 'd-tab-active',
              grow && 'grow',
            )}
            aria-label={item.title}
            defaultChecked={item.id === activeId}
            onChange={() => setActiveId(item.id)}
            disabled={item.disabled}
          />
        ))}
      </div>
      <div>{items.find((item) => item.id === activeId)?.content}</div>
    </Fragment>
  );
}
