// popup.js

document.addEventListener('DOMContentLoaded', function () {

  displayActiveDomain();

  const elements = {
    configForm: document.getElementById('configForm'),
    format: document.getElementById('format'),
    closeButton: document.getElementById('closeBtn'),
    statusMessage: document.getElementById('status-message'),
    activeDomain: document.getElementById('active-domain'),
    enableToggle: document.getElementById('enable-toggle'),
    configSection: document.getElementById('config-section'),
    disabledSection: document.getElementById('disabled-section')
  };

  chrome.storage.sync.get(null, function (savedData) {
    try {
      const enabledData = savedData["greenPromptEnabled"];
      toggleUI(enabledData);
      const formData = savedData["form"];
      console.log('popup.js formData: ', formData);
      for (const [key, value] of Object.entries(formData)) {
        const field = elements.configForm.elements[key];
        if (field) {
          if (field.type === 'checkbox') {
            field.checked = Boolean(value);
          } else if (field.type === 'radio') {
            const radios = elements.configForm.querySelectorAll(`input[name="${key}"]`);
            radios.forEach(radio => {
              radio.checked = (radio.value === value);
            });
          } else {
            field.value = value;
          }
        }
      }
      console.log('Form loaded with saved data:', savedData);
    } catch (err) {
      console.error('Error assigning saved data to form:', err);
    }
  });

  const changedFields = {};

  elements.configForm.addEventListener('change', function (event) {
    const formData = new FormData(elements.configForm);
    for (const [name, value] of formData.entries()) {
      changedFields[name] = value;
    }

    chrome.storage.sync.set({ form: changedFields }, function () {
      console.log('Format saved to Chrome storage:', { form: changedFields });
    });
  });


  elements.closeButton.addEventListener('click', function () {
    window.parent.postMessage('CLOSE_IFRAME', '*');
  });

  function toggleUI(isEnabled) {
    if (isEnabled === "true") {
      elements.enableToggle.checked = true;
      elements.configSection.style.display = 'flex';
      elements.disabledSection.style.display = 'none';
    } else {
      elements.enableToggle.checked = false;
      elements.configSection.style.display = 'none';
      elements.disabledSection.style.display = 'flex';
    }
  }

  function displayActiveDomain() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          const knownDomains = ['chatgpt.com', 'gemini.google.com', 'chat.deepseek.com', 'claude.ai', 'perplexity.ai'];
          if (knownDomains.includes(url.hostname)) {
            elements.activeDomain.textContent = `LLM: ${url.hostname}`;
          } else {
            elements.activeDomain.textContent = 'No LLM Detected';
          }
        } catch (e) {
          elements.activeDomain.textContent = 'Invalid page';
        }
      }
    });
  }

  function showStatus(message) {
    elements.statusMessage.textContent = message;
    setTimeout(() => {
      elements.statusMessage.textContent = '';
    }, 2000);
  }

  elements.enableToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked ? "true" : "false";
    chrome.storage.sync.set({ greenPromptEnabled: isEnabled }, function () {
      toggleUI(isEnabled);
      showStatus(e.target.checked ? '    Extension enabled!' : '    Extension disabled!');
    });
  });
});