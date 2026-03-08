;(function() {
  var containers = document.querySelectorAll('.decivio-widget');
  containers.forEach(function(container) {
    var color = container.getAttribute('data-color') || '1E3A5F';
    var lang = container.getAttribute('data-lang') || 'de';
    var ref = container.getAttribute('data-ref') || 'widget';
    var compact = container.getAttribute('data-compact') || 'false';
    var iframe = document.createElement('iframe');
    iframe.src = 'https://decivio.com/widget/cod-calculator'
      + '?color=' + color
      + '&lang=' + lang
      + '&ref=' + ref
      + '&compact=' + compact;
    iframe.width = '100%';
    iframe.height = compact === 'true' ? '300' : '420';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.style.borderRadius = '12px';
    iframe.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)';
    container.appendChild(iframe);
  });
})();
