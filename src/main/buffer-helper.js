const BINARY_LENGTH = {
    'Int8': 1,
    'UInt8': 1,
    'Int16': 2,
    'UInt16': 2,
    'Int32': 4,
    'UInt32': 4,
    'BigInt64': 8,
    'BigUInt64': 8,
    'Float': 4,
    'Double': 8
  };
  
  class BufferHelper {
    constructor() {
      this.buffer = Buffer.alloc(0);
      this.cursor = 0;
    }
  
    _writeNumericType(value, type, endianness) {
      const length = BINARY_LENGTH[type];
      const newBuffer = Buffer.alloc(this.buffer.length + length);
      this.buffer.copy(newBuffer, 0);
      newBuffer['write' + type + (length > 1 ? endianness : '')](value, this.buffer.length);
      this.buffer = newBuffer;
  }
  
    writeInt8(value) {
      return this._writeNumericType(value, 'Int8');
    }
  
    writeUInt8(value) {
      return this._writeNumericType(value, 'UInt8');
    }
  
    writeInt16LE(value) {
      return this._writeNumericType(value, 'Int16', 'LE');
    }
    
    writeUInt16LE(value) {
      return this._writeNumericType(value, 'UInt16', "LE");
    }
    
    writeInt16BE(value) {
      return this._writeNumericType(value, 'Int16', "BE");
    }
    
    writeUInt16BE(value) {
      return this._writeNumericType(value, 'UInt16', "BE");
    }
    
    writeInt32LE(value) {
      return this._writeNumericType(value, 'Int32', "LE");
    }
    
    writeUInt32LE(value) {
      return this._writeNumericType(value, 'UInt32', "LE");
    }
  
    writeInt32BE(value) {
      return this._writeNumericType(value, 'Int32', 'BE');
    }
    
    writeUInt32BE(value) {
      return this._writeNumericType(value, 'UInt32', 'BE');
    }
    
    writeInt64LE(value) {
      return this._writeNumericType(value, 'BigInt64', "LE");
    }
    
    writeUInt64LE(value) {
      return this._writeNumericType(value, 'BigUInt64', "LE");
    }
  
    writeInt64BE(value) {
      return this._writeNumericType(value, 'BigInt64', "BE");
    }
    
    writeUInt64BE(value) {
      return this._writeNumericType(value, 'BigUInt64', "BE");
    }
  
    getBuffer() {
      return this.buffer;
    }
  
    getBufferLog() {
      return Array.from(this.buffer).map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }
  }
  
  module.exports =  BufferHelper