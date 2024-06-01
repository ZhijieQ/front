// import type { Router } from 'vue-router';
// import { configureDynamicParamsMenu } from '../helper/menuHelper';
// import { Menu } from '../types';
// import { PermissionModeEnum } from '@/enums/appEnum';
// import { useAppStore } from '@/store/modules/app';

// import { usePermissionStore } from '@/store/modules/permission';

// export function createParamMenuGuard(router: Router) {
//   const permissionStore = usePermissionStore();
//   router.beforeEach(async (to, _, next) => {
//     // filter no name route
//     if (!to.name) {
//       next();
//       return;
//     }

//     // menu has been built.
//     if (!permissionStore.getIsDynamicAddedRoute) {
//       next();
//       return;
//     }

//     let menus: Menu[] = [];
//     if (isBackMode()) {
//       menus = permissionStore.getBackMenuList;
//     } else if (isRouteMappingMode()) {
//       menus = permissionStore.getFrontMenuList;
//     }
//     menus.forEach((item) => configureDynamicParamsMenu(item, to.params));

//     next();
//   });
// }

// const getPermissionMode = () => {
//   const appStore = useAppStore();
//   return appStore.getProjectConfig.permissionMode;
// };

// const isBackMode = () => {
//   return getPermissionMode() === PermissionModeEnum.BACK;
// };

// const isRouteMappingMode = () => {
//   return getPermissionMode() === PermissionModeEnum.ROUTE_MAPPING;
// };
