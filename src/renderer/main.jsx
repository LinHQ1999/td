import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

createRoot(document.getElementById("root")).render(<App />)

function App() {
  const [input, setInput] = useState('')
  const [res, setRes] = useState({ loading: false, current: 0, total: 0 })
  const inputRef = useRef(undefined)

  useEffect(() => {
    window.SC.onSearch((res) => {
      setRes({
        loading: false,
        current: res.activeMatchOrdinal,
        total: res.matches,
      })
    })
  }, [])

  function handleBtn(forward = true) {
    setRes({ ...res, loading: true })
    window.SC.search({ text: input, opts: { forward } })
  }

  function handleShortCuts(event) {
    const s = window.SC.search

    switch (event.key) {
      case 'Enter':
        if (res.loading) break
        setRes({ ...res, loading: true })
        if (event.shiftKey)
          s({ text: input, cancel: false, opts: { forward: false } })
        else
          s({ text: input, cancel: false, })
        break;
      case 'Escape':
        if (input) {
          setInput('')
        }
        else {
          setRes({ current: 0, total: 0, loading: false })
          s({ text: input, cancel: true })
        }
        break;
      default:
        break;
    }
  }

  return <div id="container">
    <input autoFocus={true} ref={inputRef} onKeyDown={handleShortCuts} value={input} onInput={(e) => {
      setInput(e.target.value)
      e.target?.value && window.SC.search({ text: e.target.value, opts: { findNext: true } })
    }} type="input" />
    <div className="buttons">
      <button disabled={res.loading} onClick={() => handleBtn(false)}><Icon icon="material-symbols:arrow-upward" /></button>
      <button disabled={res.loading} onClick={() => handleBtn()}><Icon icon="material-symbols:arrow-downward" /></button>
    </div>
    <span className="indicator">
      {
        res.loading ?
          <Icon className="rotate" icon="material-symbols:change-circle-outline" /> :
          <span>{res.current}/{res.total}</span>
      }
    </span>
  </div>
}
