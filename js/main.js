// HTML include
async function includeHTML() {
    const targets = document.querySelectorAll('[data-include]');
    for (const el of targets) {
        const path = el.getAttribute('data-include');
        try {
            const res = await fetch(path, { cache: 'no-cache' });
            if (!res.ok) { el.innerHTML = `<!-- include failed: ${path} (${res.status}) -->`; continue; }
            el.innerHTML = await res.text();
        } catch (e) {
            el.innerHTML = `<!-- include error: ${path} -->`;
        }
    }

    // index.html（ルート）からのリンクパスを補正
    try {
        const isInBlogs = window.location.pathname.includes('/blogs/');
        if (!isInBlogs) {
            document.querySelectorAll('#blogList a.blog-item').forEach((a) => {
                const href = a.getAttribute('href') || '';
                if (href.startsWith('./')) a.setAttribute('href', 'blogs/' + href.slice(2));
                else if (href.startsWith('../')) a.setAttribute('href', href.replace(/^\.\.\//, ''));
            });
        }
    } catch (e) {}

    if (typeof initBlogPagination === 'function') initBlogPagination();
    if (typeof initScrollAnimationClasses === 'function') initScrollAnimationClasses();
    if (typeof initFadeInTextInview === 'function') initFadeInTextInview();
    if (typeof initSectionInview === 'function') initSectionInview();
}

(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => includeHTML());
    } else {
        includeHTML();
    }
})();

// ブログ：6件ずつページネーション
function initBlogPagination() {
    var $list = $('#blogList');
    var $pager = $('#blogPagination');
    if ($list.length === 0 || $pager.length === 0) return;

    var PER_PAGE = 6;
    var items = [];
    $list.find('.blog-item').each(function () { items.push($(this).clone(true)); });

    if (items.length > 0) $list.addClass('has-items');
    else $list.removeClass('has-items');

    var totalPages = Math.ceil(items.length / PER_PAGE);
    if (totalPages <= 1) { $pager.empty(); return; }

    function addBtn(label, targetPage, opts) {
        opts = opts || {};
        var $btn = $('<button type="button" class="page-btn"></button>').text(label);
        if (opts.active) $btn.addClass('is-active');
        if (opts.disabled) $btn.addClass('is-disabled');
        if (!opts.disabled) $btn.on('click', function () { renderPage(targetPage); });
        $pager.append($btn);
    }

    function renderPage(pageIndex) {
        $list.empty();
        var start = pageIndex * PER_PAGE;
        var end = Math.min(start + PER_PAGE, items.length);
        for (var i = start; i < end; i++) $list.append(items[i]);

        $pager.empty();
        addBtn('‹戻る', Math.max(pageIndex - 1, 0), { disabled: pageIndex === 0 });

        var maxNumbers = 10;
        var startNum = Math.max(0, pageIndex - Math.floor(maxNumbers / 2));
        var endNum = Math.min(totalPages, startNum + maxNumbers);
        startNum = Math.max(0, endNum - maxNumbers);

        if (startNum > 0) {
            addBtn('1', 0, { active: pageIndex === 0 });
            if (startNum > 1) $pager.append('<span class="page-sep">…</span>');
        }
        for (var p = startNum; p < endNum; p++) {
            if (startNum > 0 && p === 0) continue;
            addBtn(String(p + 1), p, { active: p === pageIndex });
        }
        if (endNum < totalPages) {
            if (endNum < totalPages - 1) $pager.append('<span class="page-sep">…</span>');
            addBtn(String(totalPages), totalPages - 1, { active: pageIndex === totalPages - 1 });
        }
        addBtn('次へ ›', Math.min(pageIndex + 1, totalPages - 1), { disabled: pageIndex === totalPages - 1 });
    }
    renderPage(0);
}

$(function () { initBlogPagination(); });

// debounce
function debounce(func, wait) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () { func.apply(context, args); }, wait);
    };
}

// メニュー
var $menubar = $('#menubar');
var $menubarHdr = $('#menubar_hdr');

$(window).on('load resize', debounce(function () {
    if (window.innerWidth < 900) {
        $('body').addClass('small-screen').removeClass('large-screen');
        $menubar.addClass('display-none').removeClass('display-block');
        $menubarHdr.removeClass('display-none ham').addClass('display-block');
    } else {
        $('body').addClass('large-screen').removeClass('small-screen');
        $menubar.addClass('display-block').removeClass('display-none');
        $menubarHdr.removeClass('display-block').addClass('display-none');
    }
}, 10));

$(function () {
    $menubarHdr.click(function () {
        $(this).toggleClass('ham');
        $menubar.toggleClass('display-block', $(this).hasClass('ham'));
    });
    $menubar.find('a[href*="#"]').click(function () {
        $menubar.removeClass('display-block');
        $menubarHdr.removeClass('ham');
    });
});

// メニュー開閉中のスクロール禁止
$(function () {
    function toggleBodyScroll() {
        var locked = $('#menubar_hdr').hasClass('ham') && !$('#menubar_hdr').hasClass('display-none');
        $('body').css({ overflow: locked ? 'hidden' : '', height: locked ? '100%' : '' });
    }
    toggleBodyScroll();
    var observer = new MutationObserver(toggleBodyScroll);
    observer.observe(document.getElementById('menubar_hdr'), { attributes: true, attributeFilter: ['class'] });
});

// スムーススクロール
$(function () {
    var headerHeight = $('header').outerHeight();
    var headerMargin = parseInt($('header').css('margin-top'));
    var totalHeaderHeight = headerHeight + headerMargin;
    var topButton = $('.pagetop');

    function smoothScroll(target) {
        var scrollTo = target === '#' ? 0 : $(target).offset().top - totalHeaderHeight;
        $('html, body').animate({ scrollTop: scrollTo }, 500);
    }

    $('a[href^="#"], .pagetop').click(function (e) {
        e.preventDefault();
        smoothScroll($(this).attr('href') || '#');
    });

    $(topButton).hide();
    $(window).scroll(function () {
        $(this).scrollTop() >= 300 ? $(topButton).fadeIn().addClass('pagetop-show') : $(topButton).fadeOut().removeClass('pagetop-show');
    });

    if (window.location.hash) {
        $('html, body').scrollTop(0);
        setTimeout(function () { smoothScroll(window.location.hash); }, 10);
    }
});

// テキストフェードイン（inview）
function initScrollAnimationClasses() {
    if (typeof $ === 'undefined') return;
    var animations = [
        ['.up', 'upstyle'],
        ['.down', 'downstyle'],
        ['.transform1', 'transform1style'],
        ['.transform2', 'transform2style'],
        ['.transform3', 'transform3style'],
        ['.blur', 'blurstyle']
    ];

    animations.forEach(function (item) {
        $(item[0]).off('inview.scrollAnimation').on('inview.scrollAnimation', function () {
            $(this).addClass(item[1]);
        });
    });
}
$(function () { initScrollAnimationClasses(); });

// テキストフェードイン（inview）
function initFadeInTextInview() {
    if (typeof $ === 'undefined') return;
    $('.fade-in-text').off('inview.fadeInText').on('inview.fadeInText', function (event, isInView) {
        if (isInView && !$(this).data('animated')) {
            var text = $(this).text();
            var innerHTML = '';
            $(this).text('');
            for (var i = 0; i < text.length; i++) {
                innerHTML += '<span class="char" style="animation-delay:' + (i * 0.2) + 's">' + text[i] + '</span>';
            }
            $(this).html(innerHTML).css('visibility', 'visible').data('animated', true);
        }
    });
}
$(function () { initFadeInTextInview(); });

// sectionフェードイン（inview）
function initSectionInview() {
    if (typeof $ === 'undefined') return;
    $('main > section').off('inview.sectionAnimation').on('inview.sectionAnimation', function (event, isInView) {
        if (isInView && !$(this).data('sectionAnimated')) {
            $(this).addClass('section-in').data('sectionAnimated', true);
        }
    });
}
$(function () { initSectionInview(); });

// スライドショー
$(function () {
    var slides = $('#mainimg .slide');
    if (slides.length === 0) return;
    var currentIndex = 0;
    slides.eq(currentIndex).css('opacity', 1).addClass('active');
    setInterval(function () {
        var nextIndex = (currentIndex + 1) % slides.length;
        slides.eq(currentIndex).css('opacity', 0).removeClass('active');
        slides.eq(nextIndex).css('opacity', 1).addClass('active');
        currentIndex = nextIndex;
    }, 4000);
});
