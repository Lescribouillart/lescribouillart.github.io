(function() {
    'use strict';

    const supportedLanguages = new Set(['fr', 'en', 'es', 'de']);
    const storedLanguage = localStorage.getItem('scribouillart-language');
    const currentLanguage = supportedLanguages.has(storedLanguage) ? storedLanguage : 'fr';
    const picker = document.querySelector('.index-language-picker');
    const currentLabel = document.querySelector('[data-language-current]');

    function protectSiteName(root) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (!node.nodeValue.includes("Le Scribouill'art")) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (node.parentElement && node.parentElement.closest('.notranslate, script, style')) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        const nodes = [];

        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }

        nodes.forEach(function(node) {
            const fragment = document.createDocumentFragment();
            const parts = node.nodeValue.split("Le Scribouill'art");

            parts.forEach(function(part, index) {
                if (index) {
                    const brand = document.createElement('span');
                    brand.className = 'notranslate';
                    brand.setAttribute('translate', 'no');
                    brand.textContent = "Le Scribouill'art";
                    fragment.appendChild(brand);
                }
                fragment.appendChild(document.createTextNode(part));
            });

            node.replaceWith(fragment);
        });
    }

    function setTranslationCookie(language) {
        const value = '/fr/' + language;
        const expires = new Date(Date.now() + 31536000000).toUTCString();
        document.cookie = 'googtrans=' + value + '; path=/; expires=' + expires + '; SameSite=Lax';
        document.cookie = 'googtrans=' + value + '; path=/; domain=' + window.location.hostname + '; expires=' + expires + '; SameSite=Lax';
    }

    function updatePicker(language) {
        if (currentLabel) {
            currentLabel.textContent = language.toUpperCase();
        }

        if (!picker) {
            return;
        }

        picker.querySelectorAll('[data-language]').forEach(function(button) {
            button.setAttribute('aria-pressed', String(button.dataset.language === language));
        });
    }

    function selectLanguage(language) {
        if (!supportedLanguages.has(language)) {
            return;
        }

        localStorage.setItem('scribouillart-language', language);
        updatePicker(language);
        setTranslationCookie(language);
        window.location.reload();
    }

    function initializeGoogleTranslate() {
        if (!window.google || !window.google.translate) {
            return;
        }

        new window.google.translate.TranslateElement({
            pageLanguage: 'fr',
            includedLanguages: 'fr,en,es,de',
            autoDisplay: false,
            multilanguagePage: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google-translate-container');
    }

    setTranslationCookie(currentLanguage);
    updatePicker(currentLanguage);
    protectSiteName(document.body);

    const brandObserver = new MutationObserver(function(records) {
        records.forEach(function(record) {
            record.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    protectSiteName(node);
                } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes("Le Scribouill'art")) {
                    protectSiteName(node.parentElement);
                }
            });
        });
    });
    brandObserver.observe(document.body, { childList: true, subtree: true });

    const container = document.createElement('div');
    container.id = 'google-translate-container';
    container.className = 'google-translate-container notranslate';
    document.body.appendChild(container);

    window.googleTranslateElementInit = initializeGoogleTranslate;
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    document.head.appendChild(script);

    if (picker) {
        picker.querySelectorAll('[data-language]').forEach(function(button) {
            button.addEventListener('click', function() {
                selectLanguage(button.dataset.language);
            });
        });

        document.addEventListener('click', function(event) {
            if (picker.open && !picker.contains(event.target)) {
                picker.open = false;
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && picker.open) {
                picker.open = false;
                picker.querySelector('summary').focus();
            }
        });
    }
})();
