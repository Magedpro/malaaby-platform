self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'منصة ملعبي ⚽';
    const options = {
      body: data.body || '',
      icon: data.icon || '/logo.png', // Fallback icon path
      badge: '/logo.png',
      data: {
        url: data.url || '/dashboard/bookings'
      },
      dir: 'rtl',
      lang: 'ar'
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Failed to parse push data, displaying fallback:', err);
    event.waitUntil(
      self.registration.showNotification('إشعار جديد من ملعبي 🏟️', {
        body: event.data.text(),
        dir: 'rtl',
        lang: 'ar'
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  let targetUrl = event.notification.data?.url || '/dashboard/bookings';
  if (targetUrl.startsWith('/')) {
    targetUrl = self.location.origin + targetUrl;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      // Check if there is already a window open with this URL or dashboard bookings
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if ((client.url === targetUrl || client.url.includes('/dashboard/bookings')) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window with the full target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
