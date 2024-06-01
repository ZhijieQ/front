import type { Menu, MenuModule } from '@/router/types';

import { transformMenuModule, getAllParentPath } from '@/router/helper/menuHelper';
import { useRouteStore } from '@/store/modules/route';

const modules = import.meta.glob('../routes/modules/**/*.ts', { eager: true }) as Recordable;

const menuModules: MenuModule[] = [];

Object.keys(modules).forEach((key) => {
  const mod = modules[key].default || {};
  const modList = Array.isArray(mod) ? [...mod] : [mod];
  menuModules.push(...modList);
});

// ===========================
// ==========Helper===========
// ===========================

const staticMenus: Menu[] = [];
(() => {
  menuModules.sort((a, b) => {
    return (a.orderNo || 0) - (b.orderNo || 0);
  });

  for (const menu of menuModules) {
    staticMenus.push(transformMenuModule(menu));
  }
})();

async function getAsyncMenus() {
  const routeStore = useRouteStore();
  //递归过滤所有隐藏的菜单
  const menuFilter = (items) => {
    return items.filter((item) => {
      const show = !item.meta?.hideMenu && !item.hideMenu;
      if (show && item.children) {
        item.children = menuFilter(item.children);
      }
      return show;
    });
  };
  return menuFilter(routeStore.getRoutes);
}

export const getMenus = async (): Promise<Menu[]> => {
  const menus = await getAsyncMenus();
  return menus;
};

export async function getCurrentParentPath(currentPath: string) {
  const menus = await getAsyncMenus();
  const allParentPath = await getAllParentPath(menus, currentPath);
  return allParentPath?.[0];
}

// Get the level 1 menu, delete children
export async function getShallowMenus(): Promise<Menu[]> {
  const menus = await getAsyncMenus();
  const shallowMenuList = menus.map((item) => ({ ...item, children: undefined }));
  return shallowMenuList;
}

// Get the children of the menu
export async function getChildrenMenus(parentPath: string) {
  const menus = await getMenus();
  const parent = menus.find((item) => item.path === parentPath);
  if (!parent || !parent.children || !!parent?.meta?.hideChildrenInMenu) {
    return [] as Menu[];
  }
  return parent.children;
}
