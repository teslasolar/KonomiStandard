// Adapters to bridge page state to CRDT
import * as Y from 'yjs';

/**
 * Bridge localStorage to CRDT
 * All localStorage operations sync across peers
 */
export function bridgeLocalStorage(doc) {
  const map = doc.getMap('localStorage');

  // Initial load from localStorage to CRDT
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    if (!map.has(key)) {
      map.set(key, value);
    }
  }

  // Sync CRDT changes to localStorage
  map.observe((event) => {
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'delete') {
        localStorage.removeItem(key);
      } else {
        const value = map.get(key);
        localStorage.setItem(key, value);
      }
    });
  });

  // Intercept localStorage.setItem
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => {
    originalSetItem(key, value);
    map.set(key, value);
  };

  // Intercept localStorage.removeItem
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  localStorage.removeItem = (key) => {
    originalRemoveItem(key);
    map.delete(key);
  };

  // Intercept localStorage.clear
  const originalClear = localStorage.clear.bind(localStorage);
  localStorage.clear = () => {
    originalClear();
    map.clear();
  };

  return map;
}

/**
 * Bridge form inputs to CRDT
 * Form values sync across peers in real-time
 */
export function bridgeForm(doc, formId) {
  const form = document.getElementById(formId);
  if (!form) {
    throw new Error(`Form not found: ${formId}`);
  }

  const map = doc.getMap(`form:${formId}`);

  // Load values from CRDT
  form.querySelectorAll('input, textarea, select').forEach((el) => {
    if (el.name && map.has(el.name)) {
      const value = map.get(el.name);
      if (el.type === 'checkbox') {
        el.checked = value;
      } else if (el.type === 'radio') {
        el.checked = el.value === value;
      } else {
        el.value = value;
      }
    }
  });

  // Sync local changes to CRDT
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.name) return;

    let value;
    if (el.type === 'checkbox') {
      value = el.checked;
    } else if (el.type === 'radio') {
      value = el.value;
    } else {
      value = el.value;
    }

    map.set(el.name, value);
  });

  // Sync CRDT changes to form
  map.observe(() => {
    form.querySelectorAll('input, textarea, select').forEach((el) => {
      if (!el.name) return;

      if (map.has(el.name)) {
        const value = map.get(el.name);
        const currentValue = el.type === 'checkbox' ? el.checked : el.value;

        if (currentValue !== value && document.activeElement !== el) {
          if (el.type === 'checkbox') {
            el.checked = value;
          } else if (el.type === 'radio') {
            el.checked = el.value === value;
          } else {
            el.value = value;
          }
        }
      }
    });
  });

  return map;
}

/**
 * Bridge canvas drawing to CRDT
 * Collaborative drawing with multi-user support
 */
export function bridgeCanvas(doc, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    throw new Error(`Canvas not found: ${canvasId}`);
  }

  const ctx = canvas.getContext('2d');
  const strokes = doc.getArray(`canvas:${canvasId}`);

  let isDrawing = false;
  let currentStroke = [];

  // Get user color from awareness
  const getMyColor = () => {
    const awareness = doc.awareness;
    if (awareness) {
      const localState = awareness.getLocalState();
      return localState?.user?.color || '#000000';
    }
    return '#000000';
  };

  // Mouse/touch event handlers
  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    currentStroke = [];
    const rect = canvas.getBoundingClientRect();
    currentStroke.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      color: getMyColor()
    });
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      color: getMyColor()
    };

    currentStroke.push(point);

    // Draw locally immediately
    if (currentStroke.length > 1) {
      const prev = currentStroke[currentStroke.length - 2];
      ctx.strokeStyle = point.color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  });

  canvas.addEventListener('mouseup', () => {
    if (isDrawing && currentStroke.length > 0) {
      strokes.push([currentStroke]);
      currentStroke = [];
    }
    isDrawing = false;
  });

  canvas.addEventListener('mouseleave', () => {
    if (isDrawing && currentStroke.length > 0) {
      strokes.push([currentStroke]);
      currentStroke = [];
    }
    isDrawing = false;
  });

  // Redraw all strokes
  const redraw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.length < 2) return;

      ctx.strokeStyle = stroke[0].color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);

      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }

      ctx.stroke();
    });
  };

  // Observe CRDT changes and redraw
  strokes.observe(() => {
    redraw();
  });

  // Initial draw
  redraw();

  return strokes;
}

/**
 * Bridge any DOM element's content to CRDT text
 */
export function bridgeElement(doc, elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element not found: ${elementId}`);
  }

  const text = doc.getText(`element:${elementId}`);

  // Load initial content
  if (text.length === 0 && element.textContent) {
    text.insert(0, element.textContent);
  }

  // Sync local changes to CRDT
  element.addEventListener('input', () => {
    const content = element.textContent;
    text.delete(0, text.length);
    text.insert(0, content);
  });

  // Sync CRDT changes to element
  text.observe(() => {
    if (document.activeElement !== element) {
      element.textContent = text.toString();
    }
  });

  return text;
}
