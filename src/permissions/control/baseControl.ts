import { BitControl } from '@/enums/bitEnum';

export const BaseControl = {
  PermissionTableRead: BitControl.b1 | 1,
  PermissionTableWrite: BitControl.b2 | 1,
};
