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
        const codeText = codeElement.textContent || codeElement.innerText;
        const copyButton = createCopyButton(codeText);
        
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);
        wrapper.appendChild(copyButton);
    }
    
    function initCopyButtons() {
        const processedBlocks = new Set();
        
        const highlights = document.querySelectorAll('.post-content .highlight');
        const pres = document.querySelectorAll('.post-content pre:not(.highlight)');
        
        highlights.forEach(function(block) {
            processCodeBlock(block, processedBlocks, true);
        });
        
        pres.forEach(function(block) {
            processCodeBlock(block, processedBlocks, false);
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCopyButtons);
    } else {
        initCopyButtons();
    }
})();
