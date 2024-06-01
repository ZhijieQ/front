import type { UserInfo } from '#/store';
import type { ErrorMessageMode } from '#/axios';
import { defineStore } from 'pinia';
import { RoleEnum } from '@/enums/roleEnum';
import { PageEnum } from '@/enums/pageEnum';
//import { ROLES_KEY, TOKEN_KEY, USER_INFO_KEY } from '@/enums/cacheEnum';
// import { getAuthCache, setAuthCache } from '@/utils/auth';
import { GetUserInfoModel, LoginParams } from '@/api/sys/model/userModel';
import { doLogout, getUserInfo, loginApi } from '@/api/sys/user';
import { useI18n } from '@/hooks/web/useI18n';
import { useMessage } from '@/hooks/web/useMessage';
import { router } from '@/router';
// import { usePermissionStore } from '@/store/modules/permission';

import { RouteRecordRaw } from 'vue-router';
// import { PAGE_NOT_FOUND_ROUTE } from '@/router/routes/basic';
import { isArray } from '@/utils/is';
import { h } from 'vue';
import { useRouteStore } from '@/store/modules/route';
// import { usePermissionStore } from './permission';

interface UserState {
  userInfo: Nullable<UserInfo>;
  token?: string | undefined;
  roleList: RoleEnum[];
  sessionTimeout?: boolean;
  lastUpdateTime: number;
  impersonation: Nullable<UserState>;
}

export const useUserStore = defineStore({
  id: 'app-user',
  persist: true,
  state: (): UserState => ({
    // user info
    userInfo: null,
    // token
    token: undefined,
    // roleList
    roleList: [],
    // Whether the login expired
    sessionTimeout: false,
    // Last fetch time
    lastUpdateTime: 0,
    impersonation: null,
  }),
  getters: {
    getUserInfo(state): Nullable<UserInfo> {
      return state.userInfo;
    },
    getToken(state): string | undefined {
      return state.token;
    },
    getRoleList(state): RoleEnum[] {
      return state.roleList;
    },
    getSessionTimeout(state): boolean {
      return !!state.sessionTimeout;
    },
    getLastUpdateTime(state): number {
      return state.lastUpdateTime;
    },
    getImpersonation(state): Nullable<UserState> {
      return state.impersonation;
    },
  },
  actions: {
    setToken(info: string | undefined) {
      this.token = info;
      //setAuthCache(TOKEN_KEY, info);
    },
    setRoleList(roleList: RoleEnum[]) {
      this.roleList = roleList;
      //setAuthCache(ROLES_KEY, roleList);
    },
    setUserInfo(info: UserInfo | null) {
      this.userInfo = info;
      //this.lastUpdateTime = new Date().getTime();
      //setAuthCache(USER_INFO_KEY, info);
    },
    setLastUpdateTime(date: Date) {
      this.lastUpdateTime = date.getTime();
    },
    setSessionTimeout(flag: boolean) {
      this.sessionTimeout = flag;
    },

    setImpersonation(impersonation: Nullable<UserState>) {
      this.impersonation = impersonation;
    },

    resetState() {
      this.userInfo = null;
      this.token = '';
      this.roleList = [];
      this.sessionTimeout = false;
      this.impersonation = null;
    },
    /**
     * @description: login
     */
    async login(
      params: LoginParams & {
        goHome?: boolean;
        mode?: ErrorMessageMode;
      },
    ): Promise<GetUserInfoModel | null> {
      try {
        const { goHome = true, mode, ...loginParams } = params;
        const data = await loginApi(loginParams, mode);
        const { token } = data;

        // save token
        this.setToken(token);
        return this.afterLoginAction(goHome);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    async afterLoginAction(goHome?: boolean): Promise<GetUserInfoModel | null> {
      // TODO: set new sessionOut
      if (!this.getToken) return null;
      // get user info
      const userInfo = await this.getUserInfoAction();

      const routeStore = useRouteStore();
      this.setSessionTimeout(false);
      const routes = await routeStore.buildRoutesAction();
      routes.forEach((route) => {
        router.addRoute(route as unknown as RouteRecordRaw);
      });
      goHome && (await router.replace(userInfo?.homePath || PageEnum.BASE_HOME));
      // const sessionTimeout = this.sessionTimeout;
      // if (sessionTimeout) {
      //   this.setSessionTimeout(false);
      // } else {
      //   const permissionStore = usePermissionStore();

      //   // 动态路由加载（首次）
      //   if (!permissionStore.isDynamicAddedRoute) {
      //     const routes = await permissionStore.buildRoutesAction();
      //     [...routes].forEach((route) => {
      //       router.addRoute(route as unknown as RouteRecordRaw);
      //     });
      //     // 记录动态路由加载完成
      //     permissionStore.setDynamicAddedRoute(true);
      //   }

      //   goHome && (await router.replace(userInfo?.homePath || PageEnum.BASE_HOME));
      // }
      return userInfo;
    },
    async getUserInfoAction(): Promise<UserInfo | null> {
      if (!this.getToken) return null;
      const userInfo = await getUserInfo();
      const { roles = [] } = userInfo;
      if (isArray(roles)) {
        this.setRoleList(roles.map((item) => item.value) as RoleEnum[]);
      } else {
        this.setRoleList([]);
      }

      // const routeStore = useRouteStore();
      // if (isArray(bitControls)) {
      //   routeStore.setBitControls(
      //     bitControls.map((item) => [item[0], item[1] << 16]) as Array<number[]>,
      //   );
      // } else {
      //   routeStore.setBitControls([]);
      // }

      this.setUserInfo(userInfo);
      return userInfo;
    },
    /**
     * @description: logout
     */
    async logout(goLogin = false) {
      if (this.getToken) {
        try {
          await doLogout();
        } catch {
          console.log('注销Token失败');
        }
      }
      this.setToken(undefined);
      this.setSessionTimeout(false);
      this.setUserInfo(null);
      if (goLogin) {
        // 直接回登陆页
        router.replace(PageEnum.BASE_LOGIN);
      } else {
        // 回登陆页带上当前路由地址
        router.replace({
          path: PageEnum.BASE_LOGIN,
          query: {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          },
        });
      }
    },

    /**
     * @description: Confirm before logging out
     */
    confirmLoginOut() {
      const { createConfirm } = useMessage();
      const { t } = useI18n();
      createConfirm({
        iconType: 'warning',
        title: () => h('span', t('sys.app.logoutTip')),
        content: () => h('span', t('sys.app.logoutMessage')),
        onOk: async () => {
          // 主动登出，不带redirect地址
          await this.logout(true);
        },
      });
    },
  },
});
