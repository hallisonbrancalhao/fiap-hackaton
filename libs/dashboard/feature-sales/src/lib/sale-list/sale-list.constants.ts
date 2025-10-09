import { SALE_STATUS } from '@fiap-hackaton/dashboard-domain';

type TagSeverity = 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger';

export const SALE_STATUS_SEVERITIES: Record<SALE_STATUS, TagSeverity> = {
  [SALE_STATUS.COMPLETED]: 'success',
  [SALE_STATUS.PENDING]: 'warn',
  [SALE_STATUS.CANCELLED]: 'danger',
};
