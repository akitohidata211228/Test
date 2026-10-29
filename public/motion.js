(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function revealAll() {
        var els = document.querySelectorAll('.reveal:not(.in)');
        if (reduce || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            });
        }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
        els.forEach(function (el) { io.observe(el); });
    }

    function countUp(el, target, suffix) {
        if (reduce || target == null) {
            el.textContent = (target == null ? '–' : target) + (suffix || '');
            return;
        }
        var start = null;
        var dur = 700;
        var from = 0;
        target = Number(target) || 0;
        function tick(now) {
            if (start == null) start = now;
            var p = Math.min(1, (now - start) / dur);
            p = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(from + (target - from) * p) + (suffix || '');
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    var Motion = {
        revealAll: revealAll,
        countUp: countUp,
        types: function types(el, text, speed) {
            if (reduce) { el.textContent = text; return Promise.resolve(); }
            return new Promise(function (done) {
                var i = 0;
                (function step() {
                    if (i >= text.length) return done();
                    el.appendChild(document.createTextNode(text[i++]));
                    setTimeout(step, speed || 34);
                })();
            });
        },
        get reduce() { return reduce; }
    };

    window.LirenxinMotion = Motion;
})();
