/**
 * Application configuration
 */

import projectSetting from '@/settings/projectSetting';

import { updateDarkTheme } from '@/logics/theme/dark';
import { updateHeaderBgColor, updateSidebarBgColor } from '@/logics/theme/updateBackground';
import { updateColorWeak } from '@/logics/theme/updateColorWeak';
import { updateGrayMode } from '@/logics/theme/updateGrayMode';

import { useAppStore } from '@/store/modules/app';
//import { useLocaleStore } from '@/store/modules/locale';

//import { getCommonStoragePrefix, getStorageShortName } from '@/utils/env';

import { ThemeEnum } from '@/enums/appEnum';
import { deepMerge } from '@/utils';

// Initial project configuration
export function initAppConfigStore() {
  //const localeStore = useLocaleStore();
  const appStore = useAppStore();
  let projCfg = appStore.getProjectConfig;
  projCfg = deepMerge(projectSetting, projCfg || {});
  const {
    colorWeak,
    grayMode,

    headerSetting: { bgColor: headerBgColor } = {},
    menuSetting: { bgColor } = {},
  } = projCfg;
  try {
    grayMode && updateGrayMode(grayMode);
    colorWeak && updateColorWeak(colorWeak);
  } catch (error) {
    console.log(error);
  }
  appStore.setProjectConfig(projCfg);

  // init dark mode
  const darkMode = appStore.getDarkMode;
  updateDarkTheme(darkMode);
  if (darkMode === ThemeEnum.DARK) {
    updateHeaderBgColor();
    updateSidebarBgColor();
  } else {
    headerBgColor && updateHeaderBgColor(headerBgColor);
    bgColor && updateSidebarBgColor(bgColor);
  }
  // init store
  //localeStore.initLocale();

  /*setTimeout(() => {
    clearObsoleteStorage();
  }, 16);*/
}

/**
 * As the version continues to iterate, there will be more and more cache keys stored in localStorage.
 * This method is used to delete useless keys
 */
/*function clearObsoleteStorage() {
  const commonPrefix = getCommonStoragePrefix();
  const shortPrefix = getStorageShortName();

  [localStorage, sessionStorage].forEach((item: Storage) => {
    Object.keys(item).forEach((key) => {
      if (key && key.startsWith(commonPrefix) && !key.startsWith(shortPrefix)) {
        item.removeItem(key);
      }
    });
  });
}*/
