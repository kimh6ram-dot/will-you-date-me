(function () {
  'use strict';

  const API = 'https://countapi.mileshilliard.com/api/v1';
  const project = (document.documentElement.dataset.analyticsProject || location.pathname.split('/').filter(Boolean)[0] || 'site')
    .toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  const prefix = 'kimh6ram-20260921-' + project;

  function hit(eventName) {
    const key = (prefix + '-' + eventName).replace(/[^a-z0-9_-]+/g, '-');
    return fetch(API + '/hit/' + encodeURIComponent(key), {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      keepalive: true
    }).catch(function () {});
  }

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  hit('page_view');

  const everKey = '__kh_analytics_ever_' + project;
  if (!safeGet(everKey)) {
    safeSet(everKey, '1');
    hit('unique_visitor');
  }

  const now = new Date();
  const day = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');
  const dailyKey = '__kh_analytics_daily_' + project;
  if (safeGet(dailyKey) !== day) {
    safeSet(dailyKey, day);
    hit('daily_unique_' + day.replace(/-/g, '_'));
  }

  window.SiteAnalytics = {
    project: project,
    track: function (eventName) {
      if (!eventName) return Promise.resolve();
      return hit(String(eventName).toLowerCase().replace(/[^a-z0-9_-]+/g, '-'));
    }
  };

  window.dispatchEvent(new CustomEvent('siteanalyticsready'));
})();