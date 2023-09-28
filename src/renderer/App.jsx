import React from 'react'

const App = () => {
  return (
    <div id='app'>

<div id="editor">
        <div id="preview">
          <div id="hotspot-editor">
            <div id="dot">
              <svg xmlnssvg="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M18 12.998h-5v5a1 1 0 0 1-2 0v-5H6a1 1 0 0 1 0-2h5v-5a1 1 0 0 1 2 0v5h5a1 1 0 0 1 0 2z" fill="currentColor"></path></svg>
            </div>
          </div>
          <img src="" id="image" />
          <div id="drop-message">
            Drop here to load image
          </div>
        </div>
        <div id="size-editor">
          <input type="range" min="1" step="1" max="256" />
          <button type="button" id="btnSizeEditorReset">DEFAULT</button>
        </div>
      </div>
      <div id="config" className="flex">
        <div className="config-section">
          <div className="section-title">Cursor Image</div>
          <div className="section-subtitle">Choose PNG or SVG image, or drag it into editor</div>
          <div className="section-content">
            <div className="form-group flex">
              <div>
                <input type="file" id="inputFileImage" />
              </div>
            </div>
          </div>
        </div>
        <div className="config-section">
          <div className="section-title">Cursor Size</div>
          <div className="section-subtitle">Max size is 256x256px, will be auto adjust if it exceeds the limit.</div>
          <div className="section-content">
            <div  style={{display  : "flex" , marginTop : ".5rem"}}>
              <div className="form-group flex">
                <label className="form-label">Width</label>
                <div><span id="widthInfo">128</span>px</div>
              </div>
              <div className="form-group flex">
                <label className="form-label">Height</label>
                <div><span id="heightInfo">128</span>px</div>
              </div>
            </div>
          </div>
        </div>
        <div className="config-section">
          <div className="section-title">Hotspot</div>
          <div className="section-subtitle">Click on image or drag the hotspot, value will be auto-rounded when setting cursor.</div>
          <div className="section-content">
            <div  style={{display : "flex" , margin : "1rem 0 .5rem"}}>
              <div className="form-group flex">
                <label className="form-label">Hotspot X</label>
                <input type="text" id="hotspotInfoX" disabled style={{maxWidth : "80%" }} />
              </div>
              <div className="form-group flex">
                <label className="form-label">Hotspot Y</label>
                <input type="text" id="hotspotInfoY" disabled style={{maxWidth : "80%" }} />
              </div>
            </div>
            <button type="button" id="btnHotspotCenter" style={{fontSize : ".75rem" }} >CENTER</button>
          </div>
        </div>
        <div className="config-section" style={{marginTop : "1.5rem" }} >
          <div className="section-content">
            <div className="ak-checkbox">
              <input 
                type="checkbox" 
                id="cbKeepCursor"
                name="keep_cursor"
                checked
                />
              <label for="cbKeepCursor" className="cb"></label>
              <label for="cbKeepCursor" className="label">Keep custom cursor on reboot</label>
            </div>
          </div>
        </div>
        <div style={{textAlign  : "center"}}>
          <button type="button" id="btnCursorSet">SET CURSOR</button>
          &nbsp;
          <button type="button" id="btnCursorReset">RESET</button>
        </div>
      </div>
    </div>
   
  )
}

export default App