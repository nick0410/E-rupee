/**
 * Privacy Protection Module
 * Implements security/privacy features for fintech dashboard
 */

/**
 * Disable right-click context menu
 */
export function setupRightClickBlock() {
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  document.addEventListener("contextmenu", handleContextMenu);

  // Return cleanup function
  return () => {
    document.removeEventListener("contextmenu", handleContextMenu);
  };
}

/**
 * Block DevTools shortcut keys (F12, Ctrl+Shift+I, Ctrl+U, etc.)
 */
export function setupKeyBlock() {
  const handleKeyDown = (e) => {
    // F12
    if (e.key === "F12") {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I (Windows/Linux Inspector)
    if (e.ctrlKey && e.shiftKey && e.key === "I") {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === "J") {
      e.preventDefault();
      return false;
    }

    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === "u") {
      e.preventDefault();
      return false;
    }

    // Cmd+Option+I (Mac Inspector)
    if (e.metaKey && e.altKey && e.key === "i") {
      e.preventDefault();
      return false;
    }

    // Cmd+Option+J (Mac Console)
    if (e.metaKey && e.altKey && e.key === "j") {
      e.preventDefault();
      return false;
    }

    // Cmd+U (Mac View Source)
    if (e.metaKey && e.key === "u") {
      e.preventDefault();
      return false;
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  // Return cleanup function
  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Blur entire page when tab becomes inactive
 */
export function setupVisibilityBlur() {
  const blurOverlay = document.createElement("div");
  blurOverlay.id = "privacy-blur-overlay";
  blurOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    z-index: 999998;
    display: none;
    pointer-events: none;
  `;
  document.body.appendChild(blurOverlay);

  const handleVisibilityChange = () => {
    if (document.hidden) {
      blurOverlay.style.display = "block";
    } else {
      blurOverlay.style.display = "none";
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Return cleanup function
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (blurOverlay.parentNode) {
      blurOverlay.parentNode.removeChild(blurOverlay);
    }
  };
}

/**
 * Detect DevTools open using window size difference
 * Shows overlay message instead of breaking the app
 */
export function setupDevToolsDetection() {
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  let detectionCount = 0;
  let devToolsDetected = false;

  // Create DevTools detection overlay (initially hidden)
  const devToolsOverlay = document.createElement("div");
  devToolsOverlay.id = "devtools-warning-overlay";
  devToolsOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    display: none;
    z-index: 999999;
    pointer-events: auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `;

  const messageDiv = document.createElement("div");
  messageDiv.style.cssText = `
    color: #ef4444;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin: 20px;
    line-height: 1.5;
  `;
  messageDiv.textContent = "Developer Tools Detected\n\nThis action is not permitted for security reasons.";

  devToolsOverlay.appendChild(messageDiv);
  document.body.appendChild(devToolsOverlay);

  const checkDevTools = () => {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    const widthDiff = Math.abs(lastWidth - currentWidth);
    const heightDiff = Math.abs(lastHeight - currentHeight);

    // If significant size change detected (likely DevTools open)
    if (widthDiff > 50 || heightDiff > 50) {
      detectionCount++;
      if (detectionCount > 2) {
        devToolsDetected = true;
        devToolsOverlay.style.display = "flex";
      }
    } else {
      detectionCount = Math.max(0, detectionCount - 1);
      if (detectionCount === 0 && devToolsDetected) {
        devToolsDetected = false;
        devToolsOverlay.style.display = "none";
      }
    }

    lastWidth = currentWidth;
    lastHeight = currentHeight;
  };

  const resizeListener = () => checkDevTools();
  window.addEventListener("resize", resizeListener);

  // Check periodically as well (after a delay to allow initial render)
  const intervalId = setInterval(checkDevTools, 1000);

  // Return cleanup function
  return () => {
    window.removeEventListener("resize", resizeListener);
    clearInterval(intervalId);
    if (devToolsOverlay.parentNode) {
      devToolsOverlay.parentNode.removeChild(devToolsOverlay);
    }
  };
}

/**
 * Prevent text selection by injecting CSS
 */
export function injectNoSelectCSS() {
  const styleId = "privacy-no-select-style";

  // Check if already injected
  if (document.getElementById(styleId)) {
    return () => {
      // Cleanup function (already exists)
    };
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    * {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      -webkit-user-drag: none;
    }
    
    input[type="text"],
    input[type="password"],
    input[type="email"],
    input[type="search"],
    textarea {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
  `;

  document.head.appendChild(style);

  // Return cleanup function
  return () => {
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  };
}

/**
 * Initialize all privacy protections
 * Call this once on app mount
 */
export function initPrivacyProtection() {
  const cleanups = [
    setupRightClickBlock(),
    setupKeyBlock(),
    setupVisibilityBlur(),
    setupDevToolsDetection(),
    injectNoSelectCSS(),
  ];

  // Return a cleanup function that removes all listeners
  return () => {
    cleanups.forEach((cleanup) => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    });
  };
}
