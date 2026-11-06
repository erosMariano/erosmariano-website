/*mobile menu condition with lenis + parallax */
(function ($) {

    let lenis;
    let lenisInitialized = false;

    document.documentElement.classList.add('is-loading');

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }


    const pageScrollFrame = document.querySelector('.page-scroll-frame');
    const usingScrollFrame = function () {
        return !!(pageScrollFrame && window.matchMedia('(max-width: 767px)').matches);
    };

    window.scrollTo(0, 0);
    if (pageScrollFrame) {
        pageScrollFrame.scrollTop = 0;
    }
    $('body').addClass('no-scroll');

    // Function to initialize Lenis
    function initializeLenis() {
        if (typeof Lenis === 'undefined' || lenisInitialized) return;

        const excludeLenis = $('body').hasClass('no-lenis');
        const isMobile = window.matchMedia('(max-width: 767px)').matches;

        if (isMobile || excludeLenis) {
            document.documentElement.classList.remove('is-loading');
            $('body').removeClass('no-scroll home-no-scroll');
            return;
        }

        lenis = new Lenis({
            lerp: 0.1,
            smoothWheel: true,
            wheelMultiplier: 1,
            infinite: false,
        });

        window.lenis = lenis;

        // Anchor links must go through Lenis (native smooth scroll is disabled)
        document.addEventListener('click', function (e) {
            const a = e.target.closest && e.target.closest('a[href^="#"]');
            if (!a) return;
            const hash = a.getAttribute('href');
            if (!hash || hash === '#') return;
            const target = document.querySelector(hash);
            if (!target) return;
            e.preventDefault();
            lenis.scrollTo(target, { duration: 1.4 });
        });

        if (typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
        }

        if (typeof gsap !== 'undefined') {
            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        } else {
            function raf(time) {
                if (lenis) {
                    lenis.raf(time);
                }
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }

        lenis.on('scroll', handleParallaxScroll);
        lenisInitialized = true;
    }

    function destroyLenis() {
        if (lenisInitialized && lenis) {
            lenis.stop();
        }
    }

    function resumeLenis() {
        if (lenisInitialized && lenis) {
            lenis.start();
        }
    }

    window.resumeLenis = resumeLenis;
    window.destroyLenis = destroyLenis;


    (function () {
      var html   = document.documentElement;
      var body   = document.body;
      var toggle = document.querySelector('[data-menu-toggle]');
      var menu   = document.querySelector('[data-menu]');
      if (!toggle || !menu) return;

      var menuIsOpen = false;
      var menuScrollY = 0;

      var list    = menu.querySelector('.m-site-menu__list');
      var content = menu.querySelector('.m-site-menu__content');
      if (list) menu.style.setProperty('--n', list.children.length);


      var hasCq = !!(window.CSS && CSS.supports && CSS.supports('height', '1cqh'));
      function measure() {
        if (hasCq || !content) return;
        content.style.setProperty('--menu-w', menu.clientWidth + 'px');
        content.style.setProperty('--menu-h', menu.clientHeight + 'px');
      }
      measure();
      window.addEventListener('resize', measure);
      

      function setMenuOpen(next) {
        if (next === menuIsOpen) return;
        menuIsOpen = next;

        if (menuIsOpen) {
            body.classList.add('menu-open');
            destroyLenis();
        } else {
            body.classList.remove('menu-open');
            resumeLenis();
        }

        toggle.setAttribute('aria-expanded', menuIsOpen ? 'true' : 'false');
        toggle.setAttribute('aria-label', menuIsOpen ? 'Close menu' : 'Open menu');
        menu.setAttribute('aria-hidden', menuIsOpen ? 'false' : 'true');
        toggle.classList.toggle('active', menuIsOpen);
        menu.classList.toggle('active', menuIsOpen);
      }

      toggle.addEventListener('click', function () { setMenuOpen(!menuIsOpen); });

      menu.addEventListener('click', function (e) {
        var link = e.target.closest ? e.target.closest('a') : null;
        if (link) { setMenuOpen(false); }
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menuIsOpen) {
          setMenuOpen(false);
          toggle.focus();
        }
      });
    })();




    function initVideoObserver() {
        if (window.disableVideoObserver) return;

        const videos = document.querySelectorAll("video");
        if (!videos.length) return;

        const playPauseVideo = (video) => {
            const rect = video.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
            const ratio = visibleHeight / rect.height;

            if (ratio >= 0.25) {
                if (video.dataset.src && !video.src) {
                    video.src = video.dataset.src;
                    video.load();
                }

                video.muted = true;

                if (video.paused) {
                    video.play().catch(() => {});
                }
            } else {
                if (!video.paused) {
                    video.pause();
                }
            }
        };

        videos.forEach(playPauseVideo);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                playPauseVideo(entry.target);
            });
        }, {
            threshold: 0.25
        });

        videos.forEach((video) => observer.observe(video));
    }

    function handleParallaxScroll() {
        const $parallax = $(".parallax2");
        if (!$parallax.length) return;

        const frameEl = usingScrollFrame() ? pageScrollFrame : null;
        const scrollPosition = lenis && lenisInitialized ? lenis.scroll : (frameEl ? frameEl.scrollTop : $(window).scrollTop());
        const windowHeight = $(window).height();

        $parallax.each(function() {
            const $el = $(this);
            const offset = frameEl
                ? ($el[0].getBoundingClientRect().top - frameEl.getBoundingClientRect().top + frameEl.scrollTop)
                : $el.offset().top;
            const speed = $el.data('speed');
            const yPos = -(scrollPosition - offset) / speed;

            if (scrollPosition + windowHeight >= offset && offset + $el.height() >= scrollPosition) {
                $el.css('transform', 'translateY(' + yPos + 'px)');
            }
        });
    }

    initializeLenis();

    if (usingScrollFrame() && typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.defaults({ scroller: pageScrollFrame });
    }

    let parallaxRAFPending = false;
    $(window).on('scroll.parallax', function() {
        if (!lenisInitialized && !parallaxRAFPending) {
            parallaxRAFPending = true;
            requestAnimationFrame(function() {
                handleParallaxScroll();
                parallaxRAFPending = false;
            });
        }
    });

    if (pageScrollFrame) {
        pageScrollFrame.addEventListener('scroll', function() {
            if (!lenisInitialized && !parallaxRAFPending) {
                parallaxRAFPending = true;
                requestAnimationFrame(function() {
                    handleParallaxScroll();
                    parallaxRAFPending = false;
                });
            }
        }, { passive: true });
    }

    $(window).on('load.parallax resize.parallax', function() {
        if (!lenisInitialized) {
            handleParallaxScroll();
        }
    });

    function unlockScroll() {
        document.documentElement.classList.remove('is-loading');
        $('body').removeClass('no-scroll home-no-scroll');

        var menu = document.querySelector('[data-menu]');
        if (!menu || !menu.classList.contains('active')) {
            resumeLenis();
        }

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }

        initVideoObserver();
    }

    $(window).on('load', function () {
        setTimeout(unlockScroll, 100);
    });


})(jQuery);