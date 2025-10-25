/* global Cal */
import React, { useEffect } from 'react';

const CalEmbed = () => {
  useEffect(() => {
    (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    Cal("init", "contact-numerily-partenaire", {origin:"https://app.cal.com"});

    Cal.ns["contact-numerily-partenaire"]("inline", {
      elementOrSelector:"#my-cal-inline-contact-numerily-partenaire",
      config: {"layout":"month_view","theme":"dark"},
      calLink: "numerily/contact-numerily-partenaire",
    });

    Cal.ns["contact-numerily-partenaire"]("ui", {"theme":"dark","cssVarsPerTheme":{"light":{"cal-brand":"#0800ff"},"dark":{"cal-brand":"#004cff"}},"hideEventTypeDetails":false,"layout":"month_view"});

  }, []);

  return <div style={{ width: '100%', height: '100%', overflow: 'scroll' }} id="my-cal-inline-contact-numerily-partenaire"></div>;
};

export default CalEmbed;