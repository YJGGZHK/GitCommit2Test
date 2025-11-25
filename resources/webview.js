(function () {
  const vscode = acquireVsCodeApi();

  // State
  let streamingText = "";
  let streamInfo = null;

  // Elements
  let generateBtn;
  let settingsBtn;
  let baseBranchInput;
  let loadingEl;
  let emptyStateEl;
  let errorEl;
  let resultEl;

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[WebView] DOMContentLoaded");

    // Get elements
    generateBtn = document.getElementById("generateBtn");
    settingsBtn = document.getElementById("settingsBtn");
    baseBranchInput = document.getElementById("baseBranch");
    loadingEl = document.getElementById("loading");
    emptyStateEl = document.getElementById("emptyState");
    errorEl = document.getElementById("error");
    resultEl = document.getElementById("result");

    // Bind events
    bindEvents();
  });

  function bindEvents() {
    if (generateBtn) {
      generateBtn.addEventListener("click", handleGenerate);
      console.log("[WebView] Bound generateBtn click");
    } else {
      console.error("[WebView] generateBtn not found");
    }

    if (settingsBtn) {
      settingsBtn.addEventListener("click", handleSettings);
      console.log("[WebView] Bound settingsBtn click");
    } else {
      console.error("[WebView] settingsBtn not found");
    }
  }

  function handleGenerate(e) {
    console.log("[WebView] Generate clicked");
    if (e) e.preventDefault();

    if (generateBtn && generateBtn.disabled) return;

    // 清空之前的状态和内容
    streamingText = "";
    streamInfo = null;
    if (resultEl) {
      resultEl.innerHTML = "";
      resultEl.style.display = "none";
    }
    if (errorEl) {
      errorEl.style.display = "none";
    }
    if (emptyStateEl) {
      emptyStateEl.style.display = "none";
    }

    setLoading(true);

    const baseBranch = baseBranchInput ? baseBranchInput.value.trim() : "";

    vscode.postMessage({
      type: "generateTestCase",
      baseBranch: baseBranch || undefined,
    });
  }

  function handleSettings(e) {
    console.log("[WebView] Settings clicked");
    if (e) e.preventDefault();
    vscode.postMessage({ type: "openSettings" });
  }

  function setLoading(isLoading) {
    if (generateBtn) {
      generateBtn.disabled = isLoading;
      generateBtn.textContent = isLoading ? "正在生成..." : "生成测试用例";
    }

    if (loadingEl) {
      loadingEl.style.display = isLoading ? "block" : "none";
    }

    if (isLoading) {
      if (emptyStateEl) emptyStateEl.style.display = "none";
      if (errorEl) errorEl.style.display = "none";
    }
  }

  // Message handler
  window.addEventListener("message", (event) => {
    const message = event.data;
    console.log("[WebView] Received message:", message.type);

    try {
      switch (message.type) {
        case "loading":
          setLoading(message.status);
          break;
        case "error":
          if (errorEl) {
            errorEl.innerHTML =
              "❌ " + escapeHtml(message.message).replace(/\n/g, "<br>");
            errorEl.style.display = "block";
          }
          if (resultEl) resultEl.style.display = "none";
          setLoading(false);
          break;
        case "streamStart":
          setLoading(false);
          startStream(message.data);
          break;
        case "streamChunk":
          updateStream(message.fullText);
          break;
        case "streamEnd":
          endStream(message.data);
          break;
        case "testCaseResult":
          displayTestCase(message.data);
          setLoading(false);
          break;
      }
    } catch (error) {
      console.error("[WebView] Message handler error:", error);
      setLoading(false);
    }
  });

  function startStream(data) {
    streamingText = "";
    streamInfo = data;
    if (resultEl) resultEl.style.display = "block";
    displayStreamingText(streamInfo, "");
  }

  function updateStream(text) {
    streamingText = text;
    displayStreamingText(streamInfo, streamingText);
  }

  function endStream(data) {
    displayTestCase(data);
    streamingText = "";
    streamInfo = null;
  }

  // Utilities
  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function formatMarkdown(text) {
    if (!text) return "";
    let html = escapeHtml(text);

    html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/^\* (.+)$/gm, '<div class="md-li">• $1</div>');
    html = html.replace(/^- (.+)$/gm, '<div class="md-li">• $1</div>');
    html = html.replace(
      /^([一二三四五六七八九十]+)、(.+)$/gm,
      '<div class="md-category">$1、$2</div>'
    );
    html = html.replace(
      /^(\d+)\. (.+)$/gm,
      '<div class="md-numbered">$1. $2</div>'
    );
    html = html.replace(
      /^(用例\d+[:：].+)$/gm,
      '<div class="md-case">$1</div>'
    );
    html = html.replace(/\n/g, "<br>");

    return html;
  }

  function displayStreamingText(info, text) {
    if (!resultEl) return;
    resultEl.style.display = "block";

    let html = "";
    if (info) {
      html += '<div class="info-section">';
      html += "<h3>📋 变更信息</h3>";
      html +=
        '<div class="info-item"><strong>分支:</strong> ' +
        escapeHtml(info.branch) +
        "</div>";
      html +=
        '<div class="info-item"><strong>提交数:</strong> ' +
        info.commits.length +
        "</div>";
      html +=
        '<div class="info-item"><strong>文件数:</strong> ' +
        info.files.length +
        "</div>";
      html += "</div>";
    }

    html += '<div class="markdown-content">';
    html +=
      '<div style="color: var(--vscode-charts-green); margin-bottom: 10px; font-weight: bold;">✨ AI 正在生成中...</div>';
    html += '<div class="markdown-body">' + formatMarkdown(text) + "</div>";
    html += '<span class="cursor-blink">▋</span>';
    html += "</div>";

    resultEl.innerHTML = html;
    resultEl.scrollTop = resultEl.scrollHeight;
  }

  function displayTestCase(data) {
    if (!resultEl) return;
    resultEl.style.display = "block";

    let html = "";
    html += '<div class="info-section">';
    html += "<h3>📋 变更信息</h3>";
    html +=
      '<div class="info-item"><strong>分支:</strong> ' +
      escapeHtml(data.branch) +
      "</div>";
    html +=
      '<div class="info-item"><strong>提交数:</strong> ' +
      data.commits.length +
      "</div>";
    html +=
      '<div class="info-item"><strong>文件数:</strong> ' +
      data.files.length +
      "</div>";
    html += "</div>";

    html += '<div class="markdown-content">';
    html +=
      '<div class="markdown-body">' +
      formatMarkdown(data.result.rawText) +
      "</div>";
    html += "</div>";

    html +=
      '<button class="copy-button" id="copyBtn" data-content="' +
      escapeHtml(data.result.rawText).replace(/"/g, "&quot;") +
      '">';
    html += "📋 复制全部内容";
    html += "</button>";

    resultEl.innerHTML = html;

    const copyBtn = document.getElementById("copyBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const content = copyBtn.getAttribute("data-content");
        if (content) {
          vscode.postMessage({
            type: "copyTestCase",
            content: content,
          });
        }
      });
    }
  }
})();
