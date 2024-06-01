import { defineStore } from 'pinia';

import type { TableSetting } from '#/store';
import type { SizeType, ColumnOptionsType } from '@/components/Table/src/types/table';

interface TableSettingState {
  setting: Nullable<Partial<TableSetting>>;
}

export const useTableSettingStore = defineStore({
  id: 'table-setting',
  persist: true,
  state: (): TableSettingState => ({
    setting: null,
  }),
  getters: {
    getTableSetting(state): Nullable<Partial<TableSetting>> {
      return state.setting;
    },
    //
    getTableSize(state) {
      return state.setting?.size || 'middle';
    },
    //
    getShowIndexColumn(state) {
      return (routerName: string) => {
        return state.setting?.showIndexColumn?.[routerName];
      };
    },
    //
    getShowRowSelection(state) {
      return (routerName: string) => {
        return state.setting?.showRowSelection?.[routerName];
      };
    },
    //
    getColumns(state) {
      return (routerName: string) => {
        return state.setting?.columns && state.setting?.columns[routerName]
          ? state.setting?.columns[routerName]
          : null;
      };
    },
  },
  actions: {
    setTableSetting(setting: Partial<TableSetting>) {
      this.setting = Object.assign({}, this.setting, setting);
      //Persistent.setLocal(TABLE_SETTING_KEY, this.setting, true);
    },
    resetTableSetting() {
      //Persistent.removeLocal(TABLE_SETTING_KEY, true);
      this.setting = null;
    },
    //
    setTableSize(size: SizeType) {
      this.setTableSetting(
        Object.assign({}, this.setting, {
          size,
        }),
      );
    },
    //
    setShowIndexColumn(routerName: string, show: boolean) {
      this.setTableSetting(
        Object.assign({}, this.setting, {
          showIndexColumn: {
            ...this.setting?.showIndexColumn,
            [routerName]: show,
          },
        }),
      );
    },
    //
    setShowRowSelection(routerName: string, show: boolean) {
      this.setTableSetting(
        Object.assign({}, this.setting, {
          showRowSelection: {
            ...this.setting?.showRowSelection,
            [routerName]: show,
          },
        }),
      );
    },
    //
    setColumns(routerName: string, columns: Array<ColumnOptionsType>) {
      this.setTableSetting(
        Object.assign({}, this.setting, {
          columns: {
            ...this.setting?.columns,
            [routerName]: columns,
          },
        }),
      );
    },
    clearColumns(routerName: string) {
      this.setTableSetting(
        Object.assign({}, this.setting, {
          columns: {
            ...this.setting?.columns,
            [routerName]: undefined,
          },
        }),
      );
    },
  },
});
