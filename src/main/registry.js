const koffi = require('koffi');

import DataTypes from './type.js';

const advapi32Lib = koffi.load('advapi32.dll');
const advapi32 = {
  /* 
  LSTATUS RegOpenKeyExA(
    [in]           HKEY   hKey,
    [in, optional] LPCSTR lpSubKey,
    [in]           DWORD  ulOptions,
    [in]           REGSAM samDesired,
    [out]          PHKEY  phkResult
  );
  */
  RegOpenKeyExA: advapi32Lib.stdcall('RegOpenKeyExA', 'long', [
    'HKEY', 'string *', 'DWORD', 'int', koffi.out(koffi.pointer('HKEY'))
  ]),
  /* 
  LSTATUS RegQueryValueExA(
    [in]                HKEY    hKey,
    [in, optional]      LPCSTR  lpValueName,
                        LPDWORD lpReserved,
    [out, optional]     LPDWORD lpType,
    [out, optional]     LPBYTE  lpData,
    [in, out, optional] LPDWORD lpcbData
  );
  */
  RegQueryValueExA: advapi32Lib.stdcall('RegQueryValueExA', 'long', [
    'HKEY', 'string *', 'DWORD *', 'DWORD *', 'BYTE *', 'DWORD *',
  ]),
  /* 
  LSTATUS RegSetValueExA(
    [in]            HKEY       hKey,
    [in, optional]  LPCSTR     lpValueName,
                    DWORD      Reserved,
    [in]            DWORD      dwType,
    [in]            const BYTE *lpData,
    [in]            DWORD      cbData
  );
  */
  RegSetValueExA:advapi32Lib.stdcall('RegSetValueExA', 'long', [
    'HKEY', 'string *', 'DWORD', 'DWORD', 'BYTE *', 'DWORD',
  ]),
  /* 
  LSTATUS RegCloseKey(
    [in] HKEY hKey
  );
  */
  RegCloseKey: advapi32Lib.stdcall('RegCloseKey', 'long', [
    'HKEY',
  ]),
};

const kernel32Lib = koffi.load('kernel32.dll');
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

const HKEY = {
  HKEY_CLASSES_ROOT: 0x80000000,
  HKEY_CURRENT_USER: 0x80000001,
  HKEY_LOCAL_MACHINE: 0x80000002,
  HKEY_USERS: 0x80000003,
  HKEY_PERFORMANCE_DATA: 0x80000004,
  HKEY_CURRENT_CONFIG: 0x80000005,
  HKEY_DYN_DATA: 0X80000006,
}

const KEY = {
  KEY_ALL_ACCESS: 0xF003F,
  KEY_CREATE_LINK: 0x0020,
  KEY_CREATE_SUB_KEY: 0x0004,
  KEY_ENUMERATE_SUB_KEYS: 0x0008,
  KEY_EXECUTE: 0x20019,
  KEY_NOTIFY: 0x0010,
  KEY_QUERY_VALUE: 0x0001,
  KEY_READ: 0x20019,
  KEY_SET_VALUE: 0x0002,
  KEY_WOW64_32KEY: 0x0200,
  KEY_WOW64_64KEY: 0x0100,
  KEY_WRITE: 0x20006,
}

const VALUE_TYPE = {
  REG_SZ: 1,
  REG_EXPAND_SZ: 2,
  REG_BINARY: 3,
  REG_DWORD: 4,
  REG_DWORD_BIG_ENDIAN: 5,
  REG_DWORD_LITTLE_ENDIAN: 4,
  REG_LINK: 6,
  REG_MULTI_SZ: 7,
  REG_RESOURCE_LIST: 8
};

function stringToLPCSTR(inputString) {
  return Buffer.from(inputString + '\0', 'utf8');
}

function getErrorMessage(errorCode) {
  const msgBuffer = Buffer.alloc(512);
  const res = kernel32.FormatMessageW(
    0x00001000,
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

function read(hkey, keyPath, name, accessLevel = KEY.KEY_READ) {
  //  open
  const hKeyPtr = [null];
  let res = advapi32.RegOpenKeyExA(hkey, stringToLPCSTR(keyPath), 0, accessLevel, hKeyPtr);
  if (res !== 0) {
    throw new Error(`Failed to open registry key. Error code: ${getErrorMessage(res)}`);
  }

  // read type and value length
  const bufferLength = Buffer.alloc(koffi.sizeof('DWORD'));
  const dataType = Buffer.alloc(koffi.sizeof('DWORD'));
  res = advapi32.RegQueryValueExA(hKeyPtr[0], stringToLPCSTR(name), null, dataType, null, bufferLength);
  if (res !== 0) {
    throw new Error(`Failed to get registry value info. Error: ${getErrorMessage(res)}`);
  }
  
  // read data
  const buffer = Buffer.alloc(bufferLength.readUInt32LE(0));
  res = advapi32.RegQueryValueExA(hKeyPtr[0], stringToLPCSTR(name), null, dataType, buffer, bufferLength);
  if (res !== 0) {
    advapi32.RegCloseKey(hKeyPtr[0]);
    throw new Error(`Failed to read registry data. Error: ${getErrorMessage(res)}`);
  }

  // close
  advapi32.RegCloseKey(hKeyPtr[0]);

  return buffer;
}

function write(hKey, keyPath, name, dataType, data, accessLevel = KEY.KEY_WRITE) {
  // open
  const hKeyPtr = [null];
  let res = advapi32.RegOpenKeyExA(hKey, stringToLPCSTR(keyPath), 0, accessLevel, hKeyPtr);
  if (res !== 0) {
    throw new Error(`Failed to open registry key. Error code: ${getErrorMessage(res)}`);
  }

  // prepare data
  if (dataType == VALUE_TYPE.REG_EXPAND_SZ) {
    data += "\0";
  }
  const buffer = Buffer.from(data);
  
  // write
  res = advapi32.RegSetValueExA(hKeyPtr[0], stringToLPCSTR(name), 0, dataType, buffer, buffer.byteLength);
  if (res !== 0) {
    advapi32.RegCloseKey(hKeyPtr[0]);
    throw new Error(`Failed to write registry data. Error code: ${getErrorMessage(res)}`);
  }

  // close
  advapi32.RegCloseKey(hKeyPtr[0]);

  return true;
}

export default {
  HKEY,
  KEY,
  VALUE_TYPE,
  read,
  write,
}
