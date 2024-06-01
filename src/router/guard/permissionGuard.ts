import type { RouteLocationNormalized, Router } from 'vue-router';

//import { usePermissionStore } from '@/store/modules/permission';

import { PageEnum } from '@/enums/pageEnum';
import { useUserStore } from '@/store/modules/user';

import { PAGE_NOT_FOUND_ROUTE } from '@/router/routes/basic';
// import { usePermissionStore } from '@/store/modules/permission';
import { useRouteStore } from '@/store/modules/route';

// import { RootRoute } from '@/router/routes';

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
    // if (
    //   from.path === ROOT_PATH &&
    //   to.path === PageEnum.BASE_HOME &&
    //   userStore.getUserInfo?.homePath &&
    //   userStore.getUserInfo.homePath !== PageEnum.BASE_HOME
    // ) {
    //   next(userStore.getUserInfo.homePath);
    //   return;
    // }
    // if(to.matched.length === 0){
    //   next({name: PAGE_NOT_FOUND_ROUTE.name});
    //   return;
    // }

    const token = userStore.getToken;
    if (routeStore.getReload === true && !userStore.getSessionTimeout && token) {
      // routeStore.getRoutes.forEach((route) => {
      //   router.addRoute(route as unknown as RouteRecordRaw);
      // });
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

    // 动态路由加载（首次）
    // After call location.realod(), all app will be rebuild, so we can save this operation
    // if (!permissionStore.getIsDynamicAddedRoute) {
    //   const routes = await permissionStore.buildRoutesAction();
    //   [...routes].forEach((route) => {
    //     router.addRoute(route as unknown as RouteRecordRaw);
    //   });
    //   // 记录动态路由加载完成
    //   // This line its very weired...
    //   permissionStore.setDynamicAddedRoute(true);

    //   // 现在的to动态路由加载之前的，可能为PAGE_NOT_FOUND_ROUTE（例如，登陆后，刷新的时候）
    //   // 此处应当重定向到fullPath，否则会加载404页面内容
    //   next({ path: to.fullPath, replace: true, query: to.query });
    //   return;
    // }

    // if (permissionStore.getIsDynamicAddedRoute) {
    //   permissionStore.setDynamicAddedRoute(true);
    //   next({ path: to.fullPath, replace: true, query: to.query });
    //   return;
    // }

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
