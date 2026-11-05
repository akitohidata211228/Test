(function () {
    var KEY = 'lirenxin-theme';

    function preferred() {
        try {
            var qs = new URLSearchParams(window.location.search).get('theme');
            if (qs === 'dark' || qs === 'light') return qs;
            var saved = localStorage.getItem(KEY);
            if (saved === 'dark' || saved === 'light') return saved;
        } catch (e) {}
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark';
    }

    function apply(mode) {
        document.documentElement.classList.toggle('light', mode === 'light');
        document.documentElement.style.colorScheme = mode;
    }

    apply(preferred());

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
