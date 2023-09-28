import { Notyf } from 'notyf';
import 'notyf/notyf.min.css'; 

const notyf = new Notyf({
  position: {
    x:'center',
    y:'bottom',
  },
  duration: 4000,
  dismissible: true,
  ripple: false,
});

let selectedPath = null;

const getImageDataUrl = (f) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject(new Error("Problem processing input file"));
    };

    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(f);
  });
}

const onPageReady = async () => {
  //  ELEMENTS
  //  element:control
  const btnCursorSet = document.querySelector('#btnCursorSet');
  const btnCursorReset = document.querySelector('#btnCursorReset');
  const inputFileImage = document.querySelector('#inputFileImage');
  const cbKeepCursor = document.querySelector('#cbKeepCursor');

  //  element:editor
  const editor = document.querySelector('#editor');
  const editorPreview = editor.querySelector('#preview');

  //  element:hotspot editor
  const hotspotEditor = document.querySelector('#hotspot-editor');
  const hotspotDot = hotspotEditor.querySelector('#dot');
  const hotspotInfoX = document.querySelector('#hotspotInfoX');
  const hotspotInfoY = document.querySelector('#hotspotInfoY');
  const hotspotCenterBtn = document.querySelector('#btnHotspotCenter');

  //  element:size editor
  const sizeEditor = document.querySelector("#size-editor");
  const sizeRange = sizeEditor.querySelector("input");
  const sizeWidthInfo = document.querySelector('#widthInfo');
  const sizeHeightInfo = document.querySelector('#heightInfo');
  const sizeResetBtn = sizeEditor.querySelector(`#btnSizeEditorReset`);

  //  VARS
  let isHotspotDragging = false;
  let hotspotX, hotspotY;
  let editorZoomLevel = 1;

  //  HANDLER
  const reloadEditorState = (opt = {isResetSize: false}) => {
    const img = editor.querySelector('#image');
    const ratio = img.naturalWidth / img.naturalHeight;
    const sizeMax = parseInt(sizeRange.max);

    //  resize image if needed
    let size = img.naturalWidth > img.naturalHeight ? img.naturalWidth : img.naturalHeight;
    if (img.naturalWidth >= img.naturalHeight) {
      size = Math.round(img.naturalWidth > sizeMax ? sizeMax : img.naturalWidth);
      img.style.width = `${size}px`;
      img.style.height = `${Math.round(size / ratio)}px`;
    } else if (img.naturalHeight >= sizeMax) {
      size = Math.round(img.naturalHeight > sizeMax ? sizeMax : img.naturalHeight);
      img.style.height = `${size}px`;
      img.style.width = `${Math.round(size * ratio)}px`;
    }

    // set range value
    sizeRange.value = size;

    updateSizeInfo();

    if (opt.isResetSize) {
      updateHotspotState();
    } else {
      updateHotspotEditorSize();
      updateHotspotPosition(Math.round(img.clientWidth / 2), Math.round(img.clientHeight / 2));
  
      if (img.naturalWidth > sizeMax || img.naturalHeight > sizeMax) {
        notyf.success("Selected image has been adjusted<br>to fit within the allowed size");
      }
    }
  }
  const loadImageFromFile = async (file) => {
    if (file.type !== "image/png" && file.type !== "image/svg+xml") {
      notyf.error("Please input PNG or SVG image");
      return;
    }

    selectedPath = file.path;

    const newImage = new Image();
    editorPreview.replaceChild(newImage, editor.querySelector('#image'));
    newImage.id = "image";
    newImage.src = await getImageDataUrl(file);
    newImage.onload = () => reloadEditorState();
  }

  //  handler:control
  const cursorReset = async () => {
    let res = await window.api.cursorReset();
    if (!res.success) {
      notyf.error(result.message);
      return;
    }

    notyf.success(result.message);
  }
  const cursorSet = async (filepath) => {
    if (!filepath) {
      notyf.error("please select image to set as cursor");
      return;
    }

    roundHotspotPosition();

    let res = await window.api.cursorSet({
      path: filepath,
      hotspot: getHotspotPosition(),
      size: getImageSize(),
      permanent: cbKeepCursor.checked,
    });

    if (!res.success) {
      notyf.error(res.message);
      return;
    }

    notyf.success(res.message);
  }

  //  handler:size_editor
  const getImageSize = () => {
    const img = editor.querySelector('#image');
    return {
      width: img.clientWidth,
      height: img.clientHeight,
    };
  }
  const updateSizeInfo = () => {
    const img = editor.querySelector('#image');
    sizeWidthInfo.textContent = img.clientWidth;
    sizeHeightInfo.textContent = img.clientHeight;
  }
  const resetImageSize = () => {
    return reloadEditorState({ isResetSize: true });
  }

  //  handler:hotspot_editor
  const updateHotspotInfo = () => {
    const dotStyle = window.getComputedStyle(hotspotDot);
    hotspotInfoX.value = parseFloat(dotStyle.getPropertyValue('left'));
    hotspotInfoY.value = parseFloat(dotStyle.getPropertyValue('top'));
  }
  const updateHotspotEditorSize = () => {
    const img = editor.querySelector('#image');
    hotspotEditor.style.width = `${img.clientWidth}px`;
    hotspotEditor.style.height = `${img.clientHeight}px`;
  }
  const updateHotspotPosition = (x, y) => {
    if (x == undefined) {
      x = Number(hotspotInfoX.value);
    }
    if (y == undefined) {
      y = Number(hotspotInfoY.value);
    }

    hotspotDot.style.left = `${x}px`;
    hotspotDot.style.top = `${y}px`;
    
    hotspotInfoX.value = Number(x) ?? 0;
    hotspotInfoY.value = Number(y) ?? 0;
  }
  const roundHotspotPosition = () => {
    const dotStyle = window.getComputedStyle(hotspotDot);
    const dotX = Math.round(parseFloat(dotStyle.getPropertyValue('left')));
    const dotY = Math.round(parseFloat(dotStyle.getPropertyValue('top')));

    updateHotspotPosition(dotX, dotY);
  }
  const getHotspotPosition = () => {
    return {
      x: Number(hotspotInfoX.value) ?? 0,
      y: Number(hotspotInfoY.value) ?? 0,
    };
  }
  const updateHotspotState = () => {
    const currentSize = hotspotEditor.getBoundingClientRect();
    updateHotspotEditorSize();
    const newSize = hotspotEditor.getBoundingClientRect();

    let dotStyle = window.getComputedStyle(hotspotDot);
    const dotX = (parseFloat(dotStyle.getPropertyValue('left')) / currentSize.width) * newSize.width;
    const dotY = (parseFloat(dotStyle.getPropertyValue('top')) / currentSize.height) * newSize.height;
    updateHotspotPosition(dotX, dotY);
  }

  //  EVENT LISTENER
  //  event_listener:control
  btnCursorReset.addEventListener('click', () => cursorReset());
  btnCursorSet.addEventListener('click', (e) => cursorSet(selectedPath));
  inputFileImage.addEventListener('change', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let files = e.currentTarget.files;
    if (files.length === 0) {
      e.currentTarget.value = "";
      return;
    }
    
    let file = files[0];
    loadImageFromFile(file);
    e.currentTarget.value = "";
  });

  //  event_listener:drag_drop
  editorPreview.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    editorPreview.classList.add('active');
  });
  editorPreview.addEventListener('dragenter', (e) => {
    editorPreview.classList.add('active');
  });
  editorPreview.addEventListener('dragleave', (e) => {
    editorPreview.classList.remove('active');
  });
  editorPreview.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    editorPreview.classList.remove('active');

    let files = e.dataTransfer.files;
    if (files.length === 0) {
      return;
    }

    let file = files[0];
    loadImageFromFile(file);
  });

  //  event_listener:size_editor
  sizeRange.addEventListener('input', (e) => {
    const size = parseInt(e.currentTarget.value);
    const img = editor.querySelector('#image');
    const ratio = img.naturalWidth / img.naturalHeight;

    if (img.naturalWidth >= img.naturalHeight) {
      img.style.width = `${size}px`;
      img.style.height = `${Math.round(size / ratio)}px`;
    } else {
      img.style.height = `${size}px`;
      img.style.width = `${Math.round(size * ratio)}px`;
    }

    updateSizeInfo();
    updateHotspotState();
  });
  sizeResetBtn.addEventListener('click', (e) => resetImageSize());

  //  event_listener:hotspot_editor
  hotspotDot.querySelector('svg').addEventListener('mousedown', (e) => {
    isHotspotDragging = true;
    let rect = hotspotDot.getBoundingClientRect();
    hotspotX = e.clientX - rect.left;
    hotspotY = e.clientY - rect.top;
  });
  hotspotEditor.addEventListener('click', (e) => {
    if (e.target !== hotspotEditor) {
      return;
    }

    const rect = hotspotEditor.getBoundingClientRect();
    let left = e.clientX - rect.left - hotspotDot.offsetWidth / 2;
    let top = e.clientY - rect.top - hotspotDot.offsetHeight / 2;

    left = Math.min(rect.width, Math.max(0, left));
    top = Math.min(rect.height, Math.max(0, top));

    left = Math.round(left)
    top = Math.round(top)

    updateHotspotPosition(left, top);
  })
  document.addEventListener('mousemove', (e) => {
    if (!isHotspotDragging) return;

    const rect = hotspotEditor.getBoundingClientRect();
    let left = e.clientX - hotspotX - rect.left;
    let top = e.clientY - hotspotY - rect.top;

    left = left / editorZoomLevel
    top = top / editorZoomLevel

    left = Math.min(rect.width, Math.max(0, left));
    top = Math.min(rect.height, Math.max(0, top));

    left = Math.round(left)
    top = Math.round(top)

    updateHotspotPosition(left, top);
  })
  document.addEventListener('mouseup', () => isHotspotDragging = false)
  hotspotCenterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const img = editor.querySelector('#image');
    const rect = img.getBoundingClientRect();
    updateHotspotPosition(rect.width / 2, rect.height / 2)
  });

  reloadEditorState();
}



// F8 to reset cursor
document.addEventListener('keydown', (event) => {
  if (event.key === 'F8') {
    window.api.cursorReset();
  }
});

export {onPageReady}