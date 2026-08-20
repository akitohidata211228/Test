/*
  LǐRénXīn API — theme bootstrap
  Danzz For You 💌

  Dijalankan sebelum body render (script biasa di <head>, bukan defer),
  supaya class dark sudah nempel sebelum paint pertama. Kalau ditaruh di
  bawah, halaman sempat kelihatan putih dulu baru gelap.
*/
(function () {
    var KEY = 'lirenxin-theme';

    function preferred() {
        try {
            var saved = localStorage.getItem(KEY);
            if (saved === 'dark' || saved === 'light') return saved;
        } catch (e) {}
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    function apply(mode) {
        document.documentElement.classList.toggle('dark', mode === 'dark');
        document.documentElement.style.colorScheme = mode;
    }

    apply(preferred());

    window.LirenxinTheme = {
        current: function () {
            return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        },
        toggle: function () {
            var next = this.current() === 'dark' ? 'light' : 'dark';
            apply(next);
            try { localStorage.setItem(KEY, next); } catch (e) {}
            window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
            return next;
        },
        /* Ikut OS selama user belum pernah milih manual. */
        watchSystem: function () {
            if (!window.matchMedia) return;
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
                var saved = null;
                try { saved = localStorage.getItem(KEY); } catch (err) {}
                if (!saved) apply(e.matches ? 'dark' : 'light');
            });
        }
    };

    window.LirenxinTheme.watchSystem();
})();
