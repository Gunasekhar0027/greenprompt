//content.js

let shortcutButtonListenerattribute = "data-greenprompt-listener";
let iFrameId = "green_prompt_popup-iframe";
let shortcutButtonId = "greenprompt-integrated-btn";

const DOMAINS = {
  NONE: "",
  CHATGPT: 'chatgpt.com',
  GEMINI: 'gemini.google.com',
  PERPLEXITY: 'perplexity.ai',
  DEEPSEEK: 'chat.deepseek.com',
  CLAUDE: 'claude.ai'
};

const SITE_CONFIGS = {
  [DOMAINS.CHATGPT]: {
    promptAreaSelector: "#prompt-textarea",
    buttonSelector: 'button[aria-label="Send prompt"]',
  },
  [DOMAINS.GEMINI]: {
    promptAreaSelector: ".ql-editor",
    buttonSelector: 'button[aria-label="Send message"]',
  },
  [DOMAINS.CLAUDE]: {
    promptAreaSelector: 'div[contenteditable="true"][role="textbox"][aria-label="Write your prompt to Claude"]',
    buttonSelector: 'button[aria-label="Send message"]',
  },
  [DOMAINS.DEEPSEEK]: {
    promptAreaSelector: 'textarea[placeholder="Message DeepSeek"]',
    buttonSelector: '.ds-icon-button._7436101',
  },
  [DOMAINS.PERPLEXITY]: {
    promptAreaSelector: '#ask-input',
    buttonSelector: 'button[aria-label="Submit"]',
  },
};

const currentUrl = window.location.href;
const hostname = window.location.hostname;
let siteConfig = SITE_CONFIGS[hostname];
let formData = {}
let enabled = "false";

let clearConfigText = false;

if (clearConfigText) {
  console.log("clearConfigText");
}


createInViewButton();
setupDOMListener();



chrome.storage.sync.get(null, function (savedData) {
  console.log('savedData:', savedData);
  formData = savedData["form"];
  console.log('Initial formData loaded:', formData);
  enabled = savedData["greenPromptEnabled"];
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.form) {
    formData = changes.form.newValue;
    console.log('Updated formData loaded:', formData);
  }
  if (areaName === 'sync' && changes.greenPromptEnabled) {
    enabled = changes.greenPromptEnabled.newValue;
    console.log('Updated greenPromptEnabled loaded:', enabled);
  }
});

async function modifyPromptContainerAsync() {
  const promptContainer = document.querySelector(siteConfig.promptAreaSelector);
  if (promptContainer) {
    let originalPrompt = "";
    originalPrompt = promptContainer.textContent.trim();
    console.log("originalPrompt:", originalPrompt);
    const str = JSON.stringify(formData);
    originalPrompt = originalPrompt.replace(/response_config_start:[\s\S]*?:response_config_end/g, '');
    promptContainer.textContent = originalPrompt + "\n" + " response_config_start:" + str + ":response_config_end";
  }
}

async function interceptEvent(e) {
  if (e.__intercepted) return;

  const isClick = e.type === 'click';
  const isEnterKey = e.type === 'keydown' && e.key === 'Enter';

  if (!isClick && !isEnterKey) return;

  console.log('[PLUGIN] Intercepted', e.type, 'on', e.target);

  e.preventDefault();
  e.stopImmediatePropagation();

  const target = e.target;
  console.log("interceptEvent target:", target);
  const matchesPromptArea = siteConfig.promptAreaSelector && (target.matches(siteConfig.promptAreaSelector) || target.closest(siteConfig.promptAreaSelector));
  const matchesButton = siteConfig.buttonSelector && (target.matches(siteConfig.buttonSelector) || target.closest(siteConfig.buttonSelector));

  if ((isClick && matchesButton) || (isEnterKey && matchesPromptArea)) {
    await modifyPromptContainerAsync();
    console.log('[PLUGIN] Async work done, re-dispatching', e.type);
  } else {
    console.log('[PLUGIN] No async work, re-dispatching', e.type);
  }

  const clonedEvent = new e.constructor(e.type, e);
  Object.defineProperty(clonedEvent, '__intercepted', {
    value: true,
    enumerable: false,
  });

  if (isClick) {
    target.dispatchEvent(clonedEvent);
  } else if (isEnterKey) {
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    });

    Object.defineProperty(enterEvent, '__intercepted', {
      value: true,
      enumerable: false,
    });

    target.dispatchEvent(enterEvent);
  }
}

window.addEventListener('click', interceptEvent, true);
window.addEventListener('keydown', interceptEvent, true);

function cleanTextNodes(rootNode) {
  const IGNORE_SELECTOR = siteConfig.promptAreaSelector;

  const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null, false);

  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (parent && (parent.matches(IGNORE_SELECTOR) || parent.closest(IGNORE_SELECTOR))) {
      continue;
    }

    const originalText = node.nodeValue;
    const cleanedText = originalText.replace(/response_config_start:[\s\S]*?:response_config_end/g, '');

    if (originalText !== cleanedText) {
      node.nodeValue = cleanedText;
    }
  }
}

function setupDOMListener() {
  if (clearConfigText) {
    cleanTextNodes(document.body);
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (clearConfigText) {
          cleanTextNodes(node);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'class']
  });
}

function isEmpty(str) {
  return !str || str.trim() === '';
}

async function triggerPromptEvents(container) {
  return new Promise((resolve) => {
    const events = ['input', 'change'];

    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      container.dispatchEvent(event);
    });
    setTimeout(resolve, 10);
  });
}

function createPopupIframe() {
  if (!document.getElementById(iFrameId)) {
    const iframe = document.createElement('iframe');
    iframe.id = iFrameId;
    const ext = typeof browser !== 'undefined' ? browser : chrome;
    iframe.src = ext.runtime.getURL('popup.html');

    const iframeStyles = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '400px',
      height: '600px',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      zIndex: '10001',
      background: 'white'
    };

    Object.assign(iframe.style, iframeStyles);
    document.body.appendChild(iframe);

    iframe.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
}

window.addEventListener('message', (event) => {
  if (event.data === 'SHOW_IFRAME') {
    createPopupIframe();
  } else if (event.data === 'CLOSE_IFRAME') {
    const existingIframe = document.getElementById(iFrameId);
    if (existingIframe) {
      existingIframe.remove();
    }
  }
});


function createInViewButton() {
  if (!document.getElementById(shortcutButtonId)) {
    const integratedBtn = document.createElement('button');
    integratedBtn.id = shortcutButtonId;
    integratedBtn.innerHTML = '🌿';
    integratedBtn.title = 'GreenPrompt Settings';
    integratedBtn.setAttribute('aria-label', 'Open GreenPrompt Settings');

    const LONG_PRESS_DURATION = 300;
    const DRAG_THRESHOLD = 5;

    Object.assign(integratedBtn.style, {
      position: 'fixed',
      zIndex: '10000',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      fontSize: '22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      background: '#19c37d',
      color: 'white',
      top: '50%',
      right: '20px',
      fontWeight: 'bold'
    });

    let isDragging = false;
    let offsetX, offsetY;
    let pressTimer;
    let initialMouseX, initialMouseY;
    let hasMoved = false;

    function applyScale(button, scale) {
      button.style.transform = `scale(${scale})`;
      button.style.boxShadow = scale === '1.3' ? '0 6px 24px rgba(0, 0, 0, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.2)';
      if (scale === '1') button.style.background = '#19c37d';
    }

    integratedBtn.addEventListener('mouseenter', () => {
      integratedBtn.style.transition = 'all 0.3s ease';
      applyScale(integratedBtn, '1.3');
    });

    integratedBtn.addEventListener('mouseleave', () => {
      if (!isDragging) {
        integratedBtn.style.transition = 'all 0.3s ease';
        applyScale(integratedBtn, '1');
      }
    });

    integratedBtn.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      initialMouseX = e.clientX;
      initialMouseY = e.clientY;
      hasMoved = false;
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        isDragging = true;
        integratedBtn.style.transition = 'none';
        offsetX = e.clientX - integratedBtn.getBoundingClientRect().left;
        offsetY = e.clientY - integratedBtn.getBoundingClientRect().top;
        integratedBtn.style.position = 'absolute';
        applyScale(integratedBtn, '1.3');
        integratedBtn.style.cursor = 'grabbing';
        integratedBtn.style.border = '3px solid #f6d100';
        document.body.style.userSelect = 'none';
        e.stopPropagation();
      }, LONG_PRESS_DURATION);
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) {
        if (pressTimer) {
          const deltaX = Math.abs(e.clientX - initialMouseX);
          const deltaY = Math.abs(e.clientY - initialMouseY);
          if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) hasMoved = true;
        }
        return;
      }
      integratedBtn.style.transition = 'none';
      hasMoved = true;
      applyScale(integratedBtn, '1.3');
      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;
      newX = Math.max(0, Math.min(newX, window.innerWidth - integratedBtn.offsetWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - integratedBtn.offsetHeight));
      integratedBtn.style.left = newX + 'px';
      integratedBtn.style.top = newY + 'px';
      e.preventDefault();
    });

    document.addEventListener('mouseup', (e) => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = 'auto';
        integratedBtn.style.cursor = 'pointer';
        integratedBtn.style.border = 'none';
        integratedBtn.style.transition = 'all 0.3s ease';
        const rect = integratedBtn.getBoundingClientRect();
        const isMouseOver = e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (!isMouseOver) applyScale(integratedBtn, '1');
        hasMoved = true;
      }
    });

    integratedBtn.addEventListener('click', (e) => {
      if (hasMoved || e.button !== 0) {
        e.stopPropagation();
        e.preventDefault();
        hasMoved = false;
        return;
      }
      if (!document.getElementById(iFrameId)) {
        window.parent.postMessage('SHOW_IFRAME', '*');
      } else {
        window.parent.postMessage('CLOSE_IFRAME', '*');
      }

      e.stopPropagation();
    });

    document.body.appendChild(integratedBtn);
  }
}


