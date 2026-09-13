# Cadence — Minimalist Clock, Timer & Stopwatch

Cadence is an elegant, distraction-free timekeeper crafted in Anthropic’s signature editorial minimalist design language.

![Design Preview](https://raw.githubusercontent.com/BeagelDars/cadence-clock/master/preview.png) *(or view directly in browser)*

## ✨ Features

- **Clock**:
  - Tabular live ticking display with seconds
  - 12h / 24h format switcher
  - Dynamic localized date
  - Local timezone offset display
  - Understated minimal World Clocks for San Francisco, New York, London, and Tokyo
- **Timer**:
  - Smooth circular SVG progress ring
  - Instant presets: `1m`, `5m`, `10m`, `15m`, `25m Focus`, `45m`
  - Direct numeric editing by clicking on the digits
  - `+1m` quick-add button
  - Warm synthetic marimba / chime chord on completion using the Web Audio API (zero external audio dependencies, works 100% offline)
  - Audio mute/unmute toggle
- **Stopwatch**:
  - High-precision centisecond display (`MM:SS.cs`)
  - Lap recording with split times and total elapsed times
  - Automatic `FAST` and `SLOW` lap badges
- **Zen / Fullscreen Mode**:
  - Tap the expand icon or press `F` to turn your browser into an ambient desk clock
- **Keyboard Shortcuts**:
  - `Space`: Start / Pause
  - `R`: Reset
  - `L`: Record Lap
  - `1`, `2`, `3`: Instant switch between Clock, Timer, and Stopwatch
  - `F`: Zen / Fullscreen mode

## 🚀 Live Demo

Free live hosting on GitHub Pages:
**[https://beageldars.github.io/cadence-clock/](https://beageldars.github.io/cadence-clock/)**

## 💻 Local Development

No build steps or dependencies required. Simply open `index.html` in your browser or run:

```bash
python -m http.server 3000
```
Then visit `http://localhost:3000`.

## 📜 License

MIT License
