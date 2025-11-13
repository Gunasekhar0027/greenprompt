# Project Structure

This section explains what each file in the GreenPrompt extension does and how the pieces fit together. The goal is to give a clear understanding of how the system works, especially in relation to the design and evaluation described in the report.

---

## Core Extension Files

### manifest.json
This file tells Chrome everything it needs to know about the extension.  
It specifies:
- the extension’s name, version, and permissions  
- which scripts should run  
- which websites (ChatGPT, Gemini, Claude, Perplexity, DeepSeek) the extension should activate on

It acts as the overall configuration and determines how the rest of the extension loads.

---

### content.js
This is the main logic file and the part of the extension that does most of the work. It runs directly on supported LLM websites and handles tasks such as:

- finding the prompt input area  
- listening for when the user sends a prompt  
- attaching the GreenPrompt configuration block before the prompt is sent  
- adding the floating settings button on the page  
- opening the settings popup  
- supporting future accuracy and efficiency measurements

Most of the functionality described in the report (prompt modification, event interception, UI injection) happens here.

---

### background.js
Currently empty, but included for future expansion.  
This file is typically used for tasks that run in the background, like logging or message handling.

---

### constants.js
Also empty for now, but intended for shared values or configuration data if the project expands.

---

## User Interface Files

### popup.html
Defines the layout of the settings panel that opens when the user clicks the GreenPrompt button. This includes:

- format options  
- tone options  
- output size  
- the enable/disable toggle  
- the indicator showing which LLM is currently active

This file handles the structure of the UI, but not the behavior.

---

### popup.js
This script controls how the popup behaves. It:

- loads the user's saved settings  
- updates the settings whenever the user changes an option  
- shows which LLM domain is active  
- displays whether the extension is currently enabled  
- handles closing the popup

It essentially connects the UI to Chrome’s storage and logic.

---

### popup.css
Stylesheet for the popup window.  
Some styling is still inside popup.html, but this file is there to support future styling changes.

---

## Evaluation Tools

### evaluation/METHODOLOGY.md
Explains how we evaluate whether GreenPrompt affects the accuracy of model responses.  
It outlines:

- how we compare results with the extension on versus off  
- what metrics we look at (correctness, tokens used, latency)  
- why this evaluation is important for assessing efficiency without harming output quality

This section responds to feedback about examining accuracy when modifying prompts.

---

## Evaluation Prompts

All evaluation prompts used to test the effect of GreenPrompt on output format, tone, detail, and language are available here:

[test_prompts.md](greenprompt/evaluation/test_prompts.md)

---

## README.md
This file provides an overview of the project, its goals, how the extension is organized, and how the evaluation works.
