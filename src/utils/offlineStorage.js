// Helper de persistencia offline para Gilda
const OFFLINE_QUEUE_KEY = 'gilda_offline_queue';

export const getOfflineQueue = () => {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (e) {
    console.error('Error leyendo la cola offline:', e);
    return [];
  }
};

export const saveOfflineAction = (action) => {
  try {
    const queue = getOfflineQueue();
    queue.push({ ...action, timestamp: Date.now() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error guardando acción offline:', e);
  }
};

export const clearOfflineQueue = () => {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (e) {
    console.error('Error limpiando la cola offline:', e);
  }
};

export const initOfflineListener = (syncCallback) => {
  window.addEventListener('online', () => {
    const queue = getOfflineQueue();
    if (queue.length > 0 && typeof syncCallback === 'function') {
      syncCallback(queue);
    }
  });
};
