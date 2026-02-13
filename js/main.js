//===============================================================
// blog：6件ずつ表示 + ページ番号（各記事 = 1ボタン）
//===============================================================
$(function () {
    var $list = $('#blogList');
    var $pager = $('#blogPagination');

    if ($list.length === 0 || $pager.length === 0) return;

    var PER_PAGE = 6;

    // 元の一覧をクローンして保持（ページ切り替えでDOMを作り直すため）
    var items = [];
    $list.find('.blog-item').each(function () {
        items.push($(this).clone(true));
    });

    // 記事がある時だけ高さ固定（CSSの min-height を効かせる）
    if (items.length > 0) {
        $list.addClass('has-items');
    } else {
        $list.removeClass('has-items');
    }

    var totalPages = Math.ceil(items.length / PER_PAGE);

    // 6件以下ならページャー不要（一覧はそのまま）
    if (totalPages <= 1) {
        $pager.empty();
        return;
    }

    function addBtn(label, targetPage, opts) {
        opts = opts || {};
        var $btn = $('<button type="button" class="page-btn"></button>').text(label);

        if (opts.active) $btn.addClass('is-active');
        if (opts.disabled) $btn.addClass('is-disabled');

        if (!opts.disabled) {
            $btn.on('click', function () {
                renderPage(targetPage);
            });
        }

        $pager.append($btn);
    }

    function renderPage(pageIndex) {
        // いったん空にして、該当ページの6件だけ差し込む
        $list.empty();

        var start = pageIndex * PER_PAGE;
        var end = Math.min(start + PER_PAGE, items.length);
        for (var i = start; i < end; i++) {
            $list.append(items[i]);
        }

        // ページャー作り直し
        $pager.empty();

        // 前へ
        addBtn('‹', Math.max(pageIndex - 1, 0), { disabled: pageIndex === 0 });

        // ページ番号（最大10個表示）
        var maxNumbers = 10;
        var startNum = Math.max(0, pageIndex - Math.floor(maxNumbers / 2));
        var endNum = Math.min(totalPages, startNum + maxNumbers);
        startNum = Math.max(0, endNum - maxNumbers);

        if (startNum > 0) {
            addBtn('1', 0, { active: pageIndex === 0 });
            if (startNum > 1) {
                $pager.append('<span class="page-sep">…</span>');
            }
        }

        for (var p = startNum; p < endNum; p++) {
            if (startNum > 0 && p === 0) continue;
            addBtn(String(p + 1), p, { active: p === pageIndex });
        }

        if (endNum < totalPages) {
            if (endNum < totalPages - 1) {
                $pager.append('<span class="page-sep">…</span>');
            }
            addBtn(String(totalPages), totalPages - 1, { active: pageIndex === totalPages - 1 });
        }

        // 次へ
        addBtn('次へ ›', Math.min(pageIndex + 1, totalPages - 1), {
            disabled: pageIndex === totalPages - 1,
        });
    }

    // 初期表示
    renderPage(0);
});

//===============================================================
// debounce関数
//===============================================================
function debounce(func, wait) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


//===============================================================
// メニュー関連
//===============================================================

// 変数でセレクタを管理
var $menubar = $('#menubar');
var $menubarHdr = $('#menubar_hdr');

// menu
$(window).on("load resize", debounce(function () {
    if (window.innerWidth < 900) {	// ここがブレイクポイント指定箇所です
        // 小さな端末用の処理
        $('body').addClass('small-screen').removeClass('large-screen');
        $menubar.addClass('display-none').removeClass('display-block');
        $menubarHdr.removeClass('display-none ham').addClass('display-block');
    } else {
        // 大きな端末用の処理
        $('body').addClass('large-screen').removeClass('small-screen');
        $menubar.addClass('display-block').removeClass('display-none');
        $menubarHdr.removeClass('display-block').addClass('display-none');

        // ドロップダウンメニューが開いていれば、それを閉じる
        $('.ddmenu_parent > ul').hide();
    }
}, 10));

$(function () {

    // ハンバーガーメニューをクリックした際の処理
    $menubarHdr.click(function () {
        $(this).toggleClass('ham');
        if ($(this).hasClass('ham')) {
            $menubar.addClass('display-block');
        } else {
            $menubar.removeClass('display-block');
        }
    });

    // アンカーリンクの場合にメニューを閉じる処理
    $menubar.find('a[href*="#"]').click(function () {
        $menubar.removeClass('display-block');
        $menubarHdr.removeClass('ham');
    });

    // ドロップダウンの親liタグ（空のリンクを持つaタグのデフォルト動作を防止）
    $menubar.find('a[href=""]').click(function () {
        return false;
    });

    // ドロップダウンメニューの処理
    $menubar.find('li:has(ul)').addClass('ddmenu_parent');
    $('.ddmenu_parent > a').addClass('ddmenu');

    // タッチ開始位置を格納する変数
    var touchStartY = 0;

    // タッチデバイス用
    $('.ddmenu').on('touchstart', function (e) {
        // タッチ開始位置を記録
        touchStartY = e.originalEvent.touches[0].clientY;
    }).on('touchend', function (e) {
        // タッチ終了時の位置を取得
        var touchEndY = e.originalEvent.changedTouches[0].clientY;

        // タッチ開始位置とタッチ終了位置の差分を計算
        var touchDifference = touchStartY - touchEndY;

        // スクロール動作でない（差分が小さい）場合にのみドロップダウンを制御
        if (Math.abs(touchDifference) < 10) { // 10px以下の移動ならタップとみなす
            var $nextUl = $(this).next('ul');
            if ($nextUl.is(':visible')) {
                $nextUl.stop().hide();
            } else {
                $nextUl.stop().show();
            }
            $('.ddmenu').not(this).next('ul').hide();
            return false; // ドロップダウンのリンクがフォローされるのを防ぐ
        }
    });

    //PC用
    $('.ddmenu_parent').hover(function () {
        $(this).children('ul').stop().show();
    }, function () {
        $(this).children('ul').stop().hide();
    });

    // ドロップダウンをページ内リンクで使った場合に、ドロップダウンを閉じる
    $('.ddmenu_parent ul a').click(function () {
        $('.ddmenu_parent > ul').hide();
    });

});


//===============================================================
// 小さなメニューが開いている際のみ、body要素のスクロールを禁止。
//===============================================================
$(function () {
    function toggleBodyScroll() {
        // 条件をチェック
        if ($('#menubar_hdr').hasClass('ham') && !$('#menubar_hdr').hasClass('display-none')) {
            // #menubar_hdr が 'ham' クラスを持ち、かつ 'display-none' クラスを持たない場合、スクロールを禁止
            $('body').css({
                overflow: 'hidden',
                height: '100%'
            });
        } else {
            // その他の場合、スクロールを再び可能に
            $('body').css({
                overflow: '',
                height: ''
            });
        }
    }

    // 初期ロード時にチェックを実行
    toggleBodyScroll();

    // クラスが動的に変更されることを想定して、MutationObserverを使用
    const observer = new MutationObserver(toggleBodyScroll);
    observer.observe(document.getElementById('menubar_hdr'), { attributes: true, attributeFilter: ['class'] });
});


//===============================================================
// スムーススクロール（※バージョン2024-1）※ヘッダーの高さとマージンを取得する場合
//===============================================================
$(function () {
    var headerHeight = $('header').outerHeight();
    var headerMargin = parseInt($('header').css("margin-top"));
    var totalHeaderHeight = headerHeight + headerMargin;
    // ページ上部へ戻るボタンのセレクター
    var topButton = $('.pagetop');
    // ページトップボタン表示用のクラス名
    var scrollShow = 'pagetop-show';

    // スムーススクロールを実行する関数
    // targetにはスクロール先の要素のセレクターまたは'#'（ページトップ）を指定
    function smoothScroll(target) {
        // スクロール先の位置を計算（ページトップの場合は0、それ以外は要素の位置）
        var scrollTo = target === '#' ? 0 : $(target).offset().top - totalHeaderHeight;
        // アニメーションでスムーススクロールを実行
        $('html, body').animate({ scrollTop: scrollTo }, 500);
    }

    // ページ内リンクとページトップへ戻るボタンにクリックイベントを設定
    $('a[href^="#"], .pagetop').click(function (e) {
        e.preventDefault(); // デフォルトのアンカー動作をキャンセル
        var id = $(this).attr('href') || '#'; // クリックされた要素のhref属性を取得、なければ'#'
        smoothScroll(id); // スムーススクロールを実行
    });

    // スクロールに応じてページトップボタンの表示/非表示を切り替え
    $(topButton).hide(); // 初期状態ではボタンを隠す
    $(window).scroll(function () {
        if ($(this).scrollTop() >= 300) { // スクロール位置が300pxを超えたら
            $(topButton).fadeIn().addClass(scrollShow); // ボタンを表示
        } else {
            $(topButton).fadeOut().removeClass(scrollShow); // それ以外では非表示
        }
    });

    // ページロード時にURLのハッシュが存在する場合の処理
    if (window.location.hash) {
        // ページの最上部に即時スクロールする
        $('html, body').scrollTop(0);
        // 少し遅延させてからスムーススクロールを実行
        setTimeout(function () {
            smoothScroll(window.location.hash);
        }, 10);
    }
});


//===============================================================
// 汎用開閉処理
//===============================================================
$(function () {
    $('.openclose-parts').next().hide();
    $('.openclose-parts').click(function () {
        $(this).next().slideToggle();
        $('.openclose-parts').not(this).next().slideUp();
    });
});


//===============================================================
// テキストのフェードイン効果
//===============================================================
$(function () {
    $('.fade-in-text').on('inview', function (event, isInView) {
        // この要素が既にアニメーションされたかどうかを確認
        if (isInView && !$(this).data('animated')) {
            // アニメーションがまだ実行されていない場合
            let innerHTML = '';
            const text = $(this).text();
            $(this).text('');

            for (let i = 0; i < text.length; i++) {
                innerHTML += `<span class="char" style="animation-delay: ${i * 0.2}s;">${text[i]}</span>`;
            }

            $(this).html(innerHTML).css('visibility', 'visible');
            // アニメーションが実行されたことをマーク
            $(this).data('animated', true);
        }
    });
});

//===============================================================
// section全体を左→右にフェードイン表示（inview使用）
//===============================================================
$(function () {
    $('main > section').on('inview', function (event, isInView) {
        if (isInView && !$(this).data('sectionAnimated')) {
            $(this).addClass('section-in');
            $(this).data('sectionAnimated', true);
        }
    });
});


//===============================================================
// 詳細ページのサムネイル切り替え
//===============================================================
$(function () {
    // 初期表示: 各 .thumbnail-view に対して、直後の .thumbnail の最初の画像を表示
    $(".thumbnail-view-parts").each(function () {
        var firstThumbnailSrc = $(this).next(".thumbnail-parts").find("img:first").attr("src");
        var defaultImage = $("<img>").attr("src", firstThumbnailSrc);
        $(this).append(defaultImage);
    });

    // サムネイルがクリックされたときの動作
    $(".thumbnail-parts img").click(function () {
        var imgSrc = $(this).attr("src");
        var newImage = $("<img>").attr("src", imgSrc).hide();

        // このサムネイルの直前の .thumbnail-view 要素を取得
        var targetPhoto = $(this).parent(".thumbnail-parts").prev(".thumbnail-view-parts");

        targetPhoto.find("img").fadeOut(400, function () {
            targetPhoto.empty().append(newImage);
            newImage.fadeIn(400);
        });
    });
});


//===============================================================
// スライドショー
//===============================================================
$(function () {
    var slides = $('#mainimg .slide');
    var slideCount = slides.length;
    var currentIndex = 0;

    slides.eq(currentIndex).css('opacity', 1).addClass('active');

    setInterval(function () {
        var nextIndex = (currentIndex + 1) % slideCount;
        slides.eq(currentIndex).css('opacity', 0).removeClass('active');
        slides.eq(nextIndex).css('opacity', 1).addClass('active');
        currentIndex = nextIndex;
    }, 4000); // 4秒ごとにスライドを切り替える
});

