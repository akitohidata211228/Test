(function () {
    var KEY = 'lirenxin-theme';

    function parentMode() {
        try {
            if (window.parent && window.parent !== window) {
                var pd = window.parent.document;
                return pd.documentElement.classList.contains('dark') ? 'dark' : 'light';
            }
        } catch (e) {}
        return null;
    }

    function preferred() {
        try {
            var qs = new URLSearchParams(window.location.search).get('theme');
            if (qs === 'dark' || qs === 'light') return qs;
            var pm = parentMode();
            if (pm) return pm;
            var saved = localStorage.getItem(KEY);
            if (saved === 'dark' || saved === 'light') return saved;
        } catch (e) {}
        // Default situs = putih (light), sama seperti tema default aplikasi
        return 'light';
    }

    function apply(mode) {
        document.documentElement.classList.toggle('light', mode === 'light');
        document.documentElement.style.colorScheme = mode;
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', mode === 'light' ? '#F6EFE7' : '#171420');
    }

    apply(preferred());

    // Satu tema dengan situs induk: ikuti perubahan mode gelap/terang navbar
    try {
        if (window.parent && window.parent !== window) {
            var mo = new MutationObserver(function () {
                var pm = parentMode();
                if (pm) apply(pm);
            });
            mo.observe(window.parent.document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    } catch (e) {}

    window.LirenxinTheme = {
        current: function () {
            return document.documentElement.classList.contains('light') ? 'light' : 'dark';
        },
        toggle: function () {
            var next = this.current() === 'dark' ? 'light' : 'dark';
            apply(next);
            try { localStorage.setItem(KEY, next); } catch (e) {}
            window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
            return next;
        },
        watchSystem: function () {
            if (!window.matchMedia) return;
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
                var saved = null;
                try { saved = localStorage.getItem(KEY); } catch (err) {}
                if (!saved) apply(e.matches ? 'light' : 'dark');
            });
        }
    };

    window.LirenxinTheme.watchSystem();
})();
