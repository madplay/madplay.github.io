(function() {
    if (window.copyButtonsInitialized) {
        return;
    }
    window.copyButtonsInitialized = true;
    
    function showCopySuccess(button) {
        button.classList.add('copied');
        button.textContent = '복사됨';
        
        setTimeout(function() {
            button.classList.remove('copied');
            button.textContent = '복사';
        }, 2000);
    }
    
    function showCopyFailure(button) {
        button.textContent = '실패';
        setTimeout(function() {
            button.textContent = '복사';
        }, 2000);
    }
    
    function createCopyButton(codeText) {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = '복사';
        copyButton.setAttribute('aria-label', '코드 복사');
        
        function handleCopy() {
            navigator.clipboard.writeText(codeText).then(function() {
                showCopySuccess(copyButton);
            }).catch(function(err) {
                const textArea = document.createElement('textarea');
                textArea.value = codeText;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    showCopySuccess(copyButton);
                } catch (err) {
                    showCopyFailure(copyButton);
                }
                
                document.body.removeChild(textArea);
            });
        }
        
        copyButton.addEventListener('click', handleCopy);
        return copyButton;
    }
    
    function processCodeBlock(block, processedBlocks, skipHighlightCheck) {
        if (processedBlocks.has(block)) {
            return;
        }
        
        if (block.closest('.code-block-wrapper')) {
            processedBlocks.add(block);
            return;
        }
        
        if (!skipHighlightCheck && block.closest('.highlight')) {
            processedBlocks.add(block);
            return;
        }
        
        if (block.querySelector('.copy-button')) {
            processedBlocks.add(block);
            return;
        }
        
        if (block.parentElement && block.parentElement.classList.contains('code-block-wrapper')) {
            processedBlocks.add(block);
            return;
        }
        
        processedBlocks.add(block);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        
        const codeElement = block.querySelector('code') || block;
        const codeText = codeElement.textContent || '';
        const copyButton = createCopyButton(codeText);
        
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);
        wrapper.appendChild(copyButton);
    }
    
    function initCopyButtons() {
        const processedBlocks = new Set();
        
        const highlights = Array.prototype.slice.call(document.querySelectorAll('.post-content .highlight'));
        const pres = Array.prototype.slice.call(document.querySelectorAll('.post-content pre:not(.highlight)'));
        const queue = highlights.map(function(block) { return { block: block, skipHighlightCheck: true }; })
            .concat(pres.map(function(block) { return { block: block, skipHighlightCheck: false }; }));

        function processBatch(deadline) {
            while (queue.length) {
                const item = queue.shift();
                processCodeBlock(item.block, processedBlocks, item.skipHighlightCheck);

                if (deadline && deadline.timeRemaining && deadline.timeRemaining() < 3) {
                    break;
                }
            }

            if (!queue.length) {
                return;
            }

            if ('requestIdleCallback' in window) {
                requestIdleCallback(processBatch, { timeout: 1200 });
                return;
            }
            setTimeout(processBatch, 16);
        }

        processBatch();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCopyButtons);
    } else {
        initCopyButtons();
    }
})();
