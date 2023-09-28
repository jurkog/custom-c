const koffi = require('koffi');

const HANDLE = koffi.pointer(koffi.opaque('HANDLE'));
const HWND = koffi.alias('HWND', HANDLE);
const HKEY = koffi.alias('HKEY', HANDLE);
const DWORD = koffi.alias('DWORD', 'uint');
const LPDWORD = koffi.pointer(DWORD);
const BYTE = koffi.alias('BYTE', koffi.types.uint8);
const LPBYTE = koffi.alias('LPBYTE', koffi.pointer(BYTE));

module.exports =  {
  HANDLE,
  HWND,
  HKEY,
  DWORD,
  LPDWORD,
  BYTE,
  LPBYTE,
}