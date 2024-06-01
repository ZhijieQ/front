import type { AppRouteRecordRaw, Menu } from '@/router/types';

import { defineStore } from 'pinia';
import { useUserStore } from './user';
import { flatMultiLevelRoutes } from '@/router/helper/routeHelper';
import { transformRouteToMenu } from '@/router/helper/menuHelper';

import { asyncRoutes } from '@/router/routes';
import { ERROR_LOG_ROUTE, PAGE_NOT_FOUND_ROUTE } from '@/router/routes/basic';

import { filter } from '@/utils/helper/treeHelper';

import { PageEnum } from '@/enums/pageEnum';
import { BitControl } from '@/enums/bitEnum';

import { getBitControl } from '@/api/sys/user';

interface RouteState {
  routes: Menu[];
  // Array of control, [0] = page, [1] bitControl
  bitControls: number[][];
  reload: boolean;
  lastBuildMenuTime: number;
}

export const useRouteStore = defineStore({
  id: 'app-routes',
  persist: {
    paths: ['bitControls'],
  },
  state: (): RouteState => ({
    routes: [],
    bitControls: [],
    reload: true,
    lastBuildMenuTime: 0,
  }),
  getters: {
    getRoutes(state): Menu[] {
      return state.routes;
    },
    getReload(state): boolean {
      return state.reload;
    },
    getLastBuildMenuTime(state): number {
      return state.lastBuildMenuTime;
    },
  },
  actions: {
    setRoutes(list: Menu[]) {
      this.routes = list;
    },
    setBitControls(controls: number[][]) {
      this.bitControls = controls;
    },
    setReload(reload: boolean) {
      this.reload = reload;
    },
    setLastBuildMenuTime() {
      this.lastBuildMenuTime = new Date().getTime();
    },
    async changePermission() {
      const codeList = await getBitControl();
      const test = codeList.map((code) => [code & BitControl.bPage, code]) as number[][];
      this.setBitControls(test);
    },
    hasControl(control: number | undefined): boolean {
      if (control == undefined) return true;

      const page = control & BitControl.bPage;
      for (let i = 0; i < this.bitControls.length; i++) {
        if (page < this.bitControls[i][0]) {
          continue;
        } else if (page & this.bitControls[i][0]) {
          if (control & this.bitControls[i][1]) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }

      return false;
    },
    resetState(): void {
      this.routes = [];
    },
    // 构建路由
    async buildRoutesAction(): Promise<AppRouteRecordRaw[]> {
      const userStore = useUserStore();
      await this.changePermission();

      let routes: AppRouteRecordRaw[] = [];

      // 路由过滤器 在 函数filter 作为回调传入遍历使用
      const routeFilter = (route: AppRouteRecordRaw) => {
        const { meta } = route;
        const { permissions } = meta || undefined;
        return this.hasControl(permissions);
      };

      const routeRemoveIgnoreFilter = (route: AppRouteRecordRaw) => {
        const { meta } = route;
        // ignoreRoute 为true 则路由仅用于菜单生成，不会在实际的路由表中出现
        const { ignoreRoute } = meta || {};
        // arr.filter 返回 true 表示该元素通过测试
        return !ignoreRoute;
      };

      /**
       * @description 根据设置的首页path，修正routes中的affix标记（固定首页）
       * */
      const patchHomeAffix = (routes: AppRouteRecordRaw[]) => {
        if (!routes || routes.length === 0) return;
        let homePath: string = userStore.getUserInfo?.homePath || PageEnum.BASE_HOME;

        function patcher(routes: AppRouteRecordRaw[], parentPath = '') {
          if (parentPath) parentPath = parentPath + '/';
          routes.forEach((route: AppRouteRecordRaw) => {
            const { path, children, redirect } = route;
            const currentPath = path.startsWith('/') ? path : parentPath + path;
            if (currentPath === homePath) {
              if (redirect) {
                homePath = route.redirect! as string;
              } else {
                route.meta = Object.assign({}, route.meta, { affix: true });
                throw new Error('end');
              }
            }
            children && children.length > 0 && patcher(children, currentPath);
          });
        }

        try {
          patcher(routes);
        } catch (e) {
          // 已处理完毕跳出循环
        }
        return;
      };

      // 对非一级路由进行过滤
      routes = filter(asyncRoutes, routeFilter);
      // 对一级路由再次根据角色权限过滤
      routes = routes.filter(routeFilter);
      // 将路由转换成菜单
      const menuList = transformRouteToMenu(routes, true);
      // 移除掉 ignoreRoute: true 的路由 非一级路由
      routes = filter(routes, routeRemoveIgnoreFilter);
      // 移除掉 ignoreRoute: true 的路由 一级路由；
      routes = routes.filter(routeRemoveIgnoreFilter);
      // 对菜单进行排序
      menuList.sort((a, b) => {
        return (a.meta?.orderNo || 0) - (b.meta?.orderNo || 0);
      });
      this.setRoutes(menuList);

      routes = flatMultiLevelRoutes(routes);

      routes.push(ERROR_LOG_ROUTE, PAGE_NOT_FOUND_ROUTE);
      patchHomeAffix(routes);

      return routes;
    },
  },
});
