import React from 'react';
import type { AddonContext } from '@wealthfolio/addon-sdk';
import { Icons } from '@wealthfolio/ui';
import { CompareDashboardPage } from './pages/CompareDashboardPage';

export default function enable(ctx: AddonContext) {
  const sidebarItem = ctx.sidebar.addItem({
    id: 'wealthfolio-compare',
    label: 'Compare',
    icon: <Icons.Globe className="h-5 w-5" />,
    route: '/addon/wealthfolio-compare',
    order: 100,
  });

  const Wrapper = () => <CompareDashboardPage ctx={ctx} />;
  ctx.router.add({
    path: '/addon/wealthfolio-compare',
    component: React.lazy(() => Promise.resolve({ default: Wrapper })),
  });

  ctx.onDisable(() => {
    try {
      sidebarItem.remove();
    } catch {
      ctx.api.logger.error('Failed to remove sidebar item.');
    }
  });
}
