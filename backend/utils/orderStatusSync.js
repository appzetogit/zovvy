import shiprocketService from './shiprocketService.js';
import { restockItems } from './stockUtils.js';

const TERMINAL_STATUSES = new Set(['cancelled', 'delivered', 'returned']);
const POLLABLE_STATUSES = new Set([
  'pending',
  'processing',
  'received',
  'processed',
  'packed',
  'shipped',
  'outfordelivery',
  'out for delivery',
  'intransit',
  'in transit'
]);

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const pushStatusHistory = (order, status, info) => {
  if (!order.statusHistory) {
    order.statusHistory = [];
  }

  order.statusHistory.push({
    status,
    timestamp: new Date(),
    info
  });
};

export const normalizeOrderStatus = (status) => {
  const raw = normalizeText(status);

  if (!raw) return null;
  if (raw.includes('cancel')) return 'Cancelled';
  if (raw.includes('rto') && raw.includes('deliver')) return 'Returned';
  if (raw.includes('rto') && raw.includes('initiated')) return 'ReturnInitiated';
  if (raw.includes('return')) return raw.includes('initiated') ? 'ReturnInitiated' : 'Returned';
  if (raw.includes('out for delivery') || raw.includes('out_for_delivery') || raw.includes('outfordelivery')) {
    return 'OutForDelivery';
  }
  if (raw.includes('deliver')) return 'Delivered';
  if (
    raw.includes('ship')
    || raw.includes('transit')
    || raw.includes('pickup complete')
    || raw.includes('picked up')
  ) {
    return 'Shipped';
  }

  return null;
};

const extractStatusCandidates = (trackingData) => {
  const tracking = trackingData?.tracking_data || {};
  const shipmentTrack = Array.isArray(tracking.shipment_track) ? tracking.shipment_track : [];
  const activities = Array.isArray(tracking.shipment_track_activities) ? tracking.shipment_track_activities : [];

  return [
    trackingData?.current_status,
    trackingData?.status,
    trackingData?.shipment_status,
    tracking?.current_status,
    tracking?.shipment_status,
    tracking?.shipment_status_label,
    tracking?.track_status,
    shipmentTrack[0]?.current_status,
    shipmentTrack[0]?.shipment_status,
    shipmentTrack[0]?.status,
    shipmentTrack[0]?.sr_status,
    activities[0]?.activity,
    activities[0]?.status
  ].filter(Boolean);
};

const extractEstimatedDelivery = (trackingData) => {
  const tracking = trackingData?.tracking_data || {};
  return (
    trackingData?.estimated_delivery_date
    || tracking?.estimated_delivery_date
    || tracking?.etd
    || null
  );
};

export const syncOrderWithShiprocket = async (order, trackingDataOverride = null) => {
  if (!order || !shiprocketService.isConfigured()) {
    return false;
  }

  const hasShiprocketRef = Boolean(order.awbCode || order.shiprocketOrderId);
  if (!hasShiprocketRef) {
    return false;
  }

  const normalizedLocalStatus = normalizeText(order.status);
  const shouldPoll =
    !normalizedLocalStatus
    || POLLABLE_STATUSES.has(normalizedLocalStatus)
    || !TERMINAL_STATUSES.has(normalizedLocalStatus);

  if (!shouldPoll) {
    return false;
  }

  let trackingData = trackingDataOverride;

  if (!trackingData) {
    try {
      if (order.awbCode) {
        trackingData = await shiprocketService.trackShipment(order.awbCode);
      } else if (order.shiprocketOrderId) {
        trackingData = await shiprocketService.trackByOrderId(order.shiprocketOrderId);
      }
    } catch (error) {
      console.error(`Shiprocket sync failed for order ${order.id}:`, error.message);
      return false;
    }
  }

  if (!trackingData) {
    return false;
  }

  const statusCandidates = extractStatusCandidates(trackingData);
  const inferredStatus = statusCandidates
    .map(normalizeOrderStatus)
    .find(Boolean);

  let hasChanged = false;
  const oldStatus = order.status;
  const oldDeliveryStatus = order.deliveryStatus;

  if (inferredStatus && inferredStatus !== oldStatus) {
    order.status = inferredStatus;
    hasChanged = true;
  }

  if (inferredStatus && inferredStatus !== oldDeliveryStatus) {
    order.deliveryStatus = inferredStatus;
    hasChanged = true;
  }

  const estimatedDelivery = extractEstimatedDelivery(trackingData);
  if (estimatedDelivery) {
    const nextEstimatedDelivery = new Date(estimatedDelivery);
    if (!Number.isNaN(nextEstimatedDelivery.getTime())) {
      const oldEstimatedValue = order.estimatedDelivery ? new Date(order.estimatedDelivery).getTime() : null;
      if (oldEstimatedValue !== nextEstimatedDelivery.getTime()) {
        order.estimatedDelivery = nextEstimatedDelivery;
        hasChanged = true;
      }
    }
  }

  if (!hasChanged) {
    return false;
  }

  if (inferredStatus === 'Cancelled') {
    if (oldStatus !== 'Cancelled' && order.items?.length) {
      await restockItems(order.items);
    }
    if (!order.cancelledAt) {
      order.cancelledAt = new Date();
    }
  }

  pushStatusHistory(
    order,
    inferredStatus || order.status,
    `Status synced from Shiprocket${statusCandidates[0] ? `: ${statusCandidates[0]}` : ''}`
  );

  await order.save();
  return true;
};

export const syncOrdersWithShiprocket = async (orders) => {
  const list = Array.isArray(orders) ? orders : [orders];
  await Promise.all(list.map((order) => syncOrderWithShiprocket(order)));
};
