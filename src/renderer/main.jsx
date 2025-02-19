import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

createRoot(document.getElementById("root")).render(<App />)

function App() {
  const [input, setInput] = useState('')
  const [res, setRes] = useState({ current: 0, total: 0 })
  const inputRef = useRef(undefined)

  useEffect(() => {
    window.SC.onSearch((res) => {
      setRes({
        current: res.activeMatchOrdinal,
        total: res.matches
      })
    })
  }, [])

  function handleShortCut(event) {
    const s = window.SC.search

    switch (event.key) {
      case 'Enter':
        if (event.shiftKey)
          s({
            text: input,
            cancel: false,
            opts: {
              forward: false
            }
          })
        else
          s({
            text: input,
            cancel: false,
          })
        break;
      case 'Escape':
        if (input) {
          setInput('')
        }
        else {
          inputRef.current.blur()
          setRes({ current: 0, total: 0 })
          s({
            text: input,
            cancel: true
          })
        }
        break;
      default:
        /* if (input) {
          s({
            text: e.target.value,
            cancel: false,
            opts: {
              findNext: true
            }
          })
        } */
        break;
    }
  }

  return <>
    <div id="container">
      <input autoFocus={true} ref={inputRef} onKeyDown={handleShortCut} value={input} onInput={(e) => setInput(e.target.value)} type="input" />
      <div className="buttons">
        <button onClick={_ => window.SC.search({ text: input, opts: { forward: false } })}><Icon icon="material-symbols:arrow-upward" /></button>
        <button onClick={_ => window.SC.search({ text: input })}><Icon icon="material-symbols:arrow-downward" /></button>
      </div>
      <span>{res.current}/{res.total}</span>
    </div>

  </>
}
