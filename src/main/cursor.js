const koffi = require('koffi');
const sharp = require('sharp');

import BufferHelper from './buffer-helper.js';
import DataTypes from './type.js';

const kernel32Lib = koffi.load('kernel32.dll');
const user32Lib = koffi.load('user32.dll');

const kernel32 = {
  /* 
  DWORD GetLastError();
  */
  GetLastError: kernel32Lib.stdcall('GetLastError', 'DWORD', []),
  /* 
  DWORD FormatMessageW(
    [in]           DWORD   dwFlags,
    [in, optional] LPCVOID lpSource,
    [in]           DWORD   dwMessageId,
    [in]           DWORD   dwLanguageId,
    [out]          LPWSTR  lpBuffer,
    [in]           DWORD   nSize,
    [in, optional] va_list *Arguments
  );
 */
  FormatMessageW: kernel32Lib.stdcall('FormatMessageW', 'DWORD', [
    'DWORD', 'void *', 'DWORD', 'DWORD', 'string *', 'DWORD', 'void *',
  ]),
};

const user32 = {
  /* 
  HANDLE LoadImageW(
    [in, optional] HINSTANCE hInst,
    [in]           LPCWSTR   name,
    [in]           UINT      type,
    [in]           int       cx,
    [in]           int       cy,
    [in]           UINT      fuLoad
  );
  */
  LoadImageW: user32Lib.stdcall('LoadImageW', 'HANDLE *', [
    'HANDLE *', 'string', 'uint', 'int', 'int', 'uint',
  ]),
  /* 
  BOOL SetSystemCursor(
    [in] HCURSOR hcur,
    [in] DWORD   id
  );
  */
  SetSystemCursor: user32Lib.stdcall('SetSystemCursor', 'bool', [
    'HWND','uint',
  ]),
  /*
  BOOL SystemParametersInfoW(
    [in]      UINT  uiAction,
    [in]      UINT  uiParam,
    [in, out] PVOID pvParam,
    [in]      UINT  fWinIni
  );
  */
  SystemParametersInfoW: user32Lib.stdcall('SystemParametersInfoW', 'bool', [
    'uint', 'uint', 'void *', 'uint',
  ]),
};

//  Cursor List
//  ref: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setsystemcursor
const OCR_NORMAL = 32512; // Normal select
const OCR_IBEAM = 32513; // Text select
const OCR_WAIT = 32514; // Busy
const OCR_CROSS = 32515; // Precision select
const OCR_UP = 32516; // Alternate select
const OCR_SIZENWSE = 32642; // Diagonal resize 1
const OCR_SIZENESW = 32643; // Diagonal resize 2
const OCR_SIZEWE = 32644; // Horizontal resize
const OCR_SIZENS = 32645; // Vertical resize
const OCR_SIZEALL = 32646; // Move
const OCR_NO = 32648; // Unavailable
const OCR_HAND = 32649; // Link select
const OCR_APPSTARTING = 32650; // Working in background

//  ref: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-systemparametersinfow
const SPI_SETCURSORS = 0x0057;
const SPIF_UPDATEINIFILE = 0x01;
const SPIF_SENDCHANGE = 0x02;

//  ref: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-loadimagew
const LR_LOADFROMFILE = 0x00000010;

//  ref: https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-formatmessagew#parameters
const FORMAT_MESSAGE_FROM_SYSTEM = 0x00001000;

//  HELPERS
function stringToLPCWSTR(str) {
  const buf = Buffer.from(str + '\0', 'ucs2');
  return buf.toString();
}

function getErrorMessage(errorCode) {
  const msgBuffer = Buffer.alloc(512);
  const res = kernel32.FormatMessageW(
    FORMAT_MESSAGE_FROM_SYSTEM,
    null,
    errorCode,
    0,
    msgBuffer,
    msgBuffer.length,
    null
  );

  if (res) {
    return msgBuffer.toString('ucs2').trim();
  }

  return '';
}

function restoreSystemCursor() {
  user32.SystemParametersInfoW(SPI_SETCURSORS, 0, null, SPIF_UPDATEINIFILE | SPIF_SENDCHANGE);
}

function loadCursor(cursorPath, options = {width: 0, height: 0}) {
  const hCursor = user32.LoadImageW(null, stringToLPCWSTR(cursorPath), 2, options.width, options.height, LR_LOADFROMFILE);
  if (!hCursor) {
    const error = kernel32.GetLastError();
    const errorMessage = getErrorMessage(error);

    throw new Error(`Cannot load cursor file "${cursorPath}". Message: ${errorMessage}`);
  }

  return hCursor;
}

function setCursor(hCursor, cursorType) {
  const success = user32.SetSystemCursor(hCursor, cursorType);
  if (!success) {
    const error = kernel32.GetLastError();
    const errorMessage = getErrorMessage(error);

    throw new Error(`Cannot set cursor. Message: ${errorMessage}`);
  }

  return success;
}

function setFromFile(filepath, cursorType) {
  const hCursor = loadCursor(filepath);
  return setCursor(hCursor, cursorType);
}

async function imageToCursorData(src, options = {}) {
  let img = sharp(src);
  if (options?.size) {
    img = img.resize({
      width: options.size.width,
      height: options.size.height,
      fit: 'contain',
    });
  }

  let cursorData = await img
    .toFormat(sharp.format.png)
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      // default hotspot is center of image
      if (!options?.hotspot) {
        let sizeSource = options?.size ?? info;
        options.hotspot = {
          x: sizeSource.width / 2,
          y: sizeSource.height / 2,
        };
      }

      let cursorHeader = new BufferHelper();
      // reserved
      cursorHeader.writeUInt16LE(0);
      // type cursor
      cursorHeader.writeUInt16LE(2);
      // cursor num
      cursorHeader.writeUInt16LE(1);
      // width
      cursorHeader.writeUInt8(0);
      // height
      cursorHeader.writeUInt8(0);
      // ColorCount
      cursorHeader.writeUInt8(0);
      // Reserved
      cursorHeader.writeUInt8(0);
      // hotspot X
      cursorHeader.writeInt16LE(options.hotspot.x);
      // hotspot Y
      cursorHeader.writeInt16LE(options.hotspot.y);
      // image size
      cursorHeader.writeUInt32LE(data.length);
      // image data offset
      cursorHeader.writeUInt32LE(22);

      return Buffer.concat([cursorHeader.getBuffer(), data]);
    })

  return cursorData;
}

export default {
  cursorType: {
    Normal: OCR_NORMAL,
    TextSelect: OCR_IBEAM,
    Wait: OCR_WAIT,
    Cross: OCR_CROSS,
    Up: OCR_UP,
    ResizeDiagonal1: OCR_SIZENWSE,
    ResizeDiagonal2: OCR_SIZENESW,
    ResizeHorizontal: OCR_SIZEWE,
    ResizeVertical: OCR_SIZENS,
    Move: OCR_SIZEALL,
    Unavailable: OCR_NO,
    Link: OCR_HAND,
    Starting: OCR_APPSTARTING,
    OCR_NORMAL,
    OCR_IBEAM,
    OCR_WAIT,
    OCR_CROSS,
    OCR_UP,
    OCR_SIZENWSE,
    OCR_SIZENESW,
    OCR_SIZEWE,
    OCR_SIZENS,
    OCR_SIZEALL,
    OCR_NO,
    OCR_HAND,
    OCR_APPSTARTING,
  },
  setFromFile,
  imageToCursorData,
  restoreSystemCursor,
}
