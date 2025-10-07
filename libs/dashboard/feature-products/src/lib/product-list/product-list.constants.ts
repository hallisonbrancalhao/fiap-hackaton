import { PRODUCT_CATEGORY } from '@fiap-hackaton/dashboard-domain';

type TagSeverity = 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger';

export const PRODUCT_CATEGORY_SEVERITIES: Record<PRODUCT_CATEGORY, TagSeverity> = {
  [PRODUCT_CATEGORY.VEGETABLES]: 'success',
  [PRODUCT_CATEGORY.FRUITS]: 'warn',
  [PRODUCT_CATEGORY.GRAINS]: 'info',
  [PRODUCT_CATEGORY.DAIRY]: 'secondary',
  [PRODUCT_CATEGORY.MEAT]: 'danger',
  [PRODUCT_CATEGORY.OTHER]: 'contrast',
};
