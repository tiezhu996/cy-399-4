export const SHOOT_TYPES = ['portrait', 'wedding', 'id_photo', 'commercial', 'event'] as const;
export const TIME_SLOTS = ['morning', 'afternoon', 'full_day'] as const;
export const ORDER_STATUS = ['pending', 'confirmed', 'shooting', 'completed', 'cancelled'] as const;

export type ShootType = (typeof SHOOT_TYPES)[number];
export type TimeSlot = (typeof TIME_SLOTS)[number];
export type OrderStatus = (typeof ORDER_STATUS)[number];
