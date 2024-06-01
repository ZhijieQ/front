import type { RouteLocationNormalized, Router } from 'vue-router';

import { PageEnum } from '@/enums/pageEnum';
import { useUserStore } from '@/store/modules/user';

import { PAGE_NOT_FOUND_ROUTE } from '@/router/routes/basic';
import { useRouteStore } from '@/store/modules/route';

const LOGIN_PATH = PageEnum.BASE_LOGIN;

// const ROOT_PATH = RootRoute.path;

function buildRedirectData(to: RouteLocationNormalized) {
  const redirectData: { path: string; replace: boolean; query?: Recordable<string> } = {
    path: LOGIN_PATH,
    replace: true,
  };
  if (to.path) {
    redirectData.query = {
      ...redirectData.query,
      redirect: to.path,
    };
  }
  return redirectData;
}

const whitePathList: PageEnum[] = [LOGIN_PATH];

export function createPermissionGuard(router: Router) {
  const userStore = useUserStore();
  // const permissionStore = usePermissionStore();

  const routeStore = useRouteStore();

  router.beforeEach(async (to, from, next) => {
    const token = userStore.getToken;
    if (routeStore.getReload === true && !userStore.getSessionTimeout && token) {
      await userStore.afterLoginAction();
      routeStore.setReload(false);
      next({ path: to.fullPath, replace: false, query: to.query });
      return;
    }

    // Whitelist can be directly entered
    if (whitePathList.includes(to.path as PageEnum)) {
      if (to.path === LOGIN_PATH && token) {
        try {
          // TODO: implement sessionTimeOut
          if (userStore.getSessionTimeout) {
            await userStore.afterLoginAction();
          }
          next(decodeURIComponent((to.query?.redirect as string) || '/'));
          return;
        } catch {
          next();
        }
      }
      next();
      return;
    }
    // token or user does not exist
    if (!token) {
      // You can access without permission. You need to set the routing meta.ignoreAuth to true
      if (to.meta.ignoreAuth) {
        next();
        return;
      }

      // redirect login page
      next(buildRedirectData(to));
      return;
    }

    // get userinfo while last fetch time is empty
    if (userStore.getLastUpdateTime === 0) {
      try {
        await userStore.getUserInfoAction();
      } catch (err) {
        next(buildRedirectData(to));
        return;
      }
    }

    if (to.name === PAGE_NOT_FOUND_ROUTE.name) {
      // 遇到不存在页面，后续逻辑不再处理redirect（阻止下面else逻辑）
      from.query.redirect = '';

      if (
        from.path === LOGIN_PATH &&
        to.fullPath !== (userStore.getUserInfo?.homePath || PageEnum.BASE_HOME)
      ) {
        // 登陆重定向不存在路由，转去“首页”
        next({ path: userStore.getUserInfo?.homePath || PageEnum.BASE_HOME, replace: true });
      } else {
        // 正常前往“404”页面
        next();
      }
    } else if (from.query.redirect) {
      // 存在redirect
      const redirect = decodeURIComponent((from.query.redirect as string) || '');

      // 只处理一次 from.query.redirect
      // 也避免某场景（指向路由定义了 redirect）下的死循环
      from.query.redirect = '';

      if (redirect === to.fullPath) {
        // 已经被redirect
        next();
      } else {
        // 指向redirect
        next({ path: redirect, replace: true });
      }
    } else {
      // 正常访问
      next();
    }
  });
}
